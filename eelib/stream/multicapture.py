import time
import sys
import threading
import signal
import psutil
from threading import Event, Timer
import subprocess
import queue
from collections import defaultdict
from itertools import cycle
import torch
import numpy as np
import eelib.stream.global_variables as global_variables
from eelib.stream.stream_utils import frame_consumer_thread
from eelib.stream.stream_object import predict_consumer_thread_object
from eelib.stream.stream_object import output_consumer_thread_object
from eelib.stream.stream_utils import extract_resolution
from eelib.stream.stream_density import predict_consumer_thread_density
from eelib.stream.stream_density import output_consumer_thread_density
import eelib.store as store

FFMPEG_TIMEOUT = 10

def kill_child_processes(parent_pid, sig=signal.SIGTERM):
    try:
        parent = psutil.Process(parent_pid)
    except psutil.NoSuchProcess:
        return

    children = parent.children(recursive=True)
    for process in children:
        process.send_signal(sig)

    parent.send_signal(sig)


def execute_with_timeout(command, timeout):
    def kill_process(process):
        kill_child_processes(process.pid)

    process = subprocess.Popen(
        ' '.join(command), shell=True, stdout=subprocess.PIPE)
    timer = Timer(timeout, kill_process, args=[process])
    timer.start()
    result, _ = process.communicate()
    timer.cancel()
    if process.returncode != 0:
        raise Exception(f"\"{' '.join(command)}\" failed, possibly terminated due to timeout")

    return result


def extract_frame(stream_url, resolution):
    width, height = resolution
    print('use timeout')
    command = [
            'ffmpeg',
            '-loglevel', 'quiet',
            '-y',
            '-rtsp_transport', 'tcp',
            '-i', stream_url,
            '-stimeout', str(FFMPEG_TIMEOUT*1000000),
            '-vframes', '1',
            '-f', 'image2pipe',
            '-pix_fmt', 'rgb24',
            '-vcodec', 'rawvideo',
            '-']
    ffmpeg_output = execute_with_timeout(command, FFMPEG_TIMEOUT)
    image = np.frombuffer(ffmpeg_output, dtype='uint8').reshape(height, width, 3)
    return image


def run_multicapture_streams(frameq, arguments):
    proccess_time_seconds = 60 / len(arguments)
    resolution_map = {}

    frame_numbers = defaultdict(lambda: 0)
    try:
        for stream_index, args in cycle(zip(range(len(arguments)), arguments)):

            print("extract stream", stream_index)
            start_time = time.time()

            if global_variables.g_run_capture is False:
                print("breakout multicapture_stream")
                break

            try:
                if args['stream'] not in resolution_map:
                    print("get resolution", args['stream'])
                    resolution = extract_resolution(args['stream'])
                    if resolution is not None:
                        resolution_map[args['stream']] = resolution
                    else:
                        print("error getting resolution")
                        raise Exception("error getting resolution for stream")

                print("extract frame", args['stream'])

                frame = extract_frame(args['stream'], resolution_map[args['stream']])

                if frame is not None:
                    print("got frame")
                    model = store.get_model_by_id(args['model'])
                    frameq.put_nowait({
                        'frame': frame,
                        'url': args['stream'],
                        'model_name': model.name,
                        'frame_num': frame_numbers[stream_index],
                        'stream_index': stream_index,
                        'scale_factor': args['scale_factor'],
                        'stream_name': args['name']
                    })
                    frame_numbers[stream_index] += 1
                else:
                    print("no ffmpeg error - but also no frame")
            except ValueError as e:
                print("extract frame ERROR", e)
            except:
                print("extract frame ERROR", sys.exc_info()[0])

            end_time = time.time()
            total_time = end_time - start_time
            if total_time < proccess_time_seconds:
                print("wait")
                global_variables.waiter = Event()
                global_variables.waiter.wait(
                    proccess_time_seconds - total_time)
    except Exception as e:
        print("Exiting because of error predict thread:", e)
    finally:
        frameq.put_nowait(None)
        print("multicapture loop done")


def multicapture_stream(
    arguments,
    transformFn,
    get_model,
    get_area_points,
    on_predict_callback,
    neural_network_type
):

    torch.cuda.empty_cache()

    frameq = queue.Queue(maxsize=0)
    predictq = queue.Queue(maxsize=0)
    outputq = queue.Queue(maxsize=0)

    # start all threads
    frame_consumer = threading.Thread(
        target=frame_consumer_thread,
        args=[frameq, predictq],
        daemon=True
    )

    if neural_network_type == 'object_recognition':
        predict_consumer = threading.Thread(
            target=predict_consumer_thread_object,
            args=[predictq, outputq, arguments, get_model, get_area_points],
            daemon=True
        )
        output_consumer = threading.Thread(
            target=output_consumer_thread_object,
            args=[outputq, None, None, arguments, on_predict_callback],
            daemon=True
        )
    elif neural_network_type == 'density_estimation':
        predict_consumer = threading.Thread(
            target=predict_consumer_thread_density(False),
            args=[predictq, outputq, transformFn, arguments, get_model,
                  get_area_points],
            daemon=True
        )
        output_consumer = threading.Thread(
            target=output_consumer_thread_density,
            args=[outputq, None, None, arguments, on_predict_callback],
            daemon=True
        )
    elif neural_network_type == 'density_estimation_transformer':
        predict_consumer = threading.Thread(
            target=predict_consumer_thread_density(True),
            args=[predictq, outputq, transformFn, arguments, get_model,
                  get_area_points],
            daemon=True
        )
        output_consumer = threading.Thread(
            target=output_consumer_thread_density,
            args=[outputq, None, None, arguments,
                  on_predict_callback],
            daemon=True
        )
    else:
        print('invalid network type')
        return 1

    for idx, args in enumerate(arguments):
        model = store.get_model_by_id(args['model'])
        if model is None:
            print(f"Model with id: '{args['model']}' does not exist")
            sys.exit(1)

        on_predict_callback(
            {'event': 'START'}, args['stream'], model.name, idx)

    frame_consumer.start()
    predict_consumer.start()
    output_consumer.start()

    run_multicapture_streams(frameq, arguments)

    print('wait for join()')
    frame_consumer.join()
    predict_consumer.join()
    output_consumer.join()

    for idx, args in enumerate(arguments):
        model = store.get_model_by_id(args['model'])
        on_predict_callback(
            {'event': 'STOP'}, args['stream'], model.name, idx)

    print('done')

    return 0
