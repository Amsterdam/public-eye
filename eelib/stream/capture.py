import glob
import sys
import os
import torch
import threading
import queue
import eelib.store as store
from eelib.stream.stream_utils import open_capture
from eelib.stream.stream_utils import frame_consumer_thread
from eelib.stream.stream_object import predict_consumer_thread_object
from eelib.stream.stream_object import output_consumer_thread_object
from eelib.stream.stream_server import save_image_thread
from eelib.stream.stream_utils import reconnect
from eelib.stream.stream_density import predict_consumer_thread_density
from eelib.stream.stream_density import output_consumer_thread_density
from eelib.stream.stream_loi_density import predict_consumer_thread_lc_density
from eelib.stream.stream_loi_density import output_consumer_thread_lc_density
from eelib.stream.stream_server import StreamServer
import eelib.stream.global_variables as global_variables
import eelib.postgres as pg


def run_stream(frameq, cap, url, skip_frames, model_name, stream_name):
    captured_frames = 0
    try:
        while global_variables.g_run_capture and cap.isOpened():
            got_frame, frame = cap.read()
            if got_frame is False or global_variables.g_run_capture is False:
                break

            if captured_frames % skip_frames == 0:
                frameq.put_nowait({
                    'frame': frame,
                    'frame_num': captured_frames,
                    'url': url,
                    'model_name': model_name,
                    'stream_index': 0,
                    'stream_name': stream_name
                })
            captured_frames += 1
    except:
        print("Error", sys.exc_info())
        if global_variables.g_run_capture:
            success, cap = reconnect(cap, url)
            if success:
                run_stream(frameq, cap, url, skip_frames, model_name, stream_name)
            else:
                frameq.put_nowait(None)
        else:
            frameq.put_nowait(None)
    finally:
        if global_variables.g_run_capture:
            success, cap = reconnect(cap, url)
            if success:
                run_stream(frameq, cap, url, skip_frames,  model_name, stream_name)
            else:
                frameq.put_nowait(None)
        else:
            frameq.put_nowait(None)


def remove_stream_files(name):
    stream_files = glob.glob(os.path.join(
        os.environ['EAGLE_EYE_PATH'],
        'files',
        'streams',
        '{}*'.format(name)))

    for filename in stream_files:
        try:
            os.unlink(filename)
        except:
            print('Something went wrong removing file: ', filename)


def clean_up_stream_instance(name):
    stream_instance = store.get_stream_instance_by_name(name)
    if stream_instance:
        store.update_stream_instance_stream_path(stream_instance.id, None)

    remove_stream_files(name)


def start_capture(frameq, cap, url, model_name, input_fps, output_fps, stream_name):
    # Result of division should be an integer else the output stream will not be: 1x speed
    skip_frames = int(input_fps / output_fps)

    run_stream(frameq, cap, url, skip_frames, model_name, stream_name)


def capture_stream(
    url,
    network,
    model_id,
    model_name,
    network_type,
    output_scale_factor=None,
    input_fps=None,
    output_fps=1,
    name='',
    social_distance=False,
    transformFn=None,
    cuda=True,
    on_predict_callback=None,
    area_points=None,
    loi_points=None,
    show_heatmap=False,
    density_bias=0,
    object_threshold=None,
    non_max_suppression=None,
    sliding_window=1,
    selected_device=0,
    save_images=False,
    scale_factor=1.0,
    save_every=None
):

    pg.connect()
    torch.cuda.empty_cache()
    arguments = [{
        'stream': url,
        'network': network,
        'model': model_id,
        'network_type': network_type,
        'input_fps': input_fps,
        'output_fps': output_fps,
        'name': name,
        'output_scale_factor': output_scale_factor,
        'social_distance': social_distance,
        'cuda': cuda,
        'on_predict_callback': on_predict_callback,
        'area_points': area_points,
        'loi_points': loi_points,
        'show_heatmap': show_heatmap,
        'bias': density_bias,
        'object_threshold': object_threshold,
        'non_max_suppression': non_max_suppression,
        'sliding_window': sliding_window,
        'selected_gpu': selected_device,
        'save_images': save_images,
        'scale_factor': scale_factor,
        'save_every': save_every
    }]

    frameq = queue.Queue(maxsize=0)
    predictq = queue.Queue(maxsize=0)
    outputq = queue.Queue(maxsize=0)
    framewriteq = queue.Queue(maxsize=0) if save_images else None

    # start all threads
    frame_consumer = threading.Thread(
        target=frame_consumer_thread,
        args=[frameq, predictq, scale_factor],
        daemon=True
    )

    cap, opencv_width, opencv_height, opencv_fps = open_capture(url)
    input_fps = input_fps or opencv_fps
    stream_server = StreamServer(
       scale_factor,
       output_scale_factor,
       opencv_height,
       opencv_width,
       output_fps,
       name,
       show_heatmap
    )

    def get_model(stream_index):
        return network

    def get_area_points(stream_index):
        return area_points

    if network_type == 'object_recognition':
        predict_consumer = threading.Thread(
            target=predict_consumer_thread_object,
            args=[predictq, outputq, arguments, get_model, get_area_points],
            daemon=True
        )
        output_consumer = threading.Thread(
            target=output_consumer_thread_object,
            args=[outputq, framewriteq, stream_server, arguments, on_predict_callback],
            daemon=True
        )
    elif network_type == 'density_estimation':
        predict_consumer = threading.Thread(
            target=predict_consumer_thread_density,
            args=[predictq, outputq, transformFn, arguments, get_model, get_area_points],
            daemon=True
        )
        output_consumer = threading.Thread(
            target=output_consumer_thread_density,
            args=[outputq, framewriteq, stream_server, arguments, on_predict_callback],
            daemon=True
        )
    elif network_type == 'line_crossing_density':
        predict_consumer = threading.Thread(
            target=predict_consumer_thread_lc_density,
            args=[predictq, outputq, transformFn, arguments, get_model],
            daemon=True
        )
        output_consumer = threading.Thread(
            target=output_consumer_thread_lc_density,
            args=[outputq, framewriteq, stream_server, arguments, on_predict_callback],
            daemon=True
        )
    else:
        print('invalid network type')
        return 1

    if save_images:
        save_image_consumer = threading.Thread(
            target=save_image_thread,
            args=[framewriteq, arguments],
            daemon=True
        )

    frame_consumer.start()
    if save_images:
        save_image_consumer.start()

    predict_consumer.start()
    output_consumer.start()
    print("START ALL THREADS")

    on_predict_callback({'event': 'START'}, url, model_name)

    start_capture(
        frameq=frameq,
        cap=cap,
        url=url,
        model_name=model_name,
        input_fps=input_fps,
        output_fps=output_fps,
        stream_name=name
    )

    print('wait for join()')
    frame_consumer.join()
    predict_consumer.join()
    output_consumer.join()
    if save_images and network_type == 'density_estimation':
        save_image_consumer.join()

    print('all threads joined main thread...close server')
    stream_server.close_server()
    print('server closed...')

    clean_up_stream_instance(name)
    print('Removed stream files..')

    on_predict_callback({ 'event': 'STOP' }, url, model_name)

    return 0


def main():
    import argparse
    torch.cuda.empty_cache()

    parser = argparse.ArgumentParser(description='Start a stream')
    parser.add_argument('--checkpoint', type=str, help='path to checkpoint for model', required=True)
    parser.add_argument('--stream', type=str, help='path to stream (e.g. udp://@127.0.0.1:5010)', required=True)

    args = parser.parse_args()

    url = args.stream
    checkpoint_path = args.checkpoint

    cuda = True

    network = ModelRegistry().get_network('train_yolo.py', model_path=checkpoint_path)
    if cuda is False:
        network = network.cpu()

    #capture_object_stream(url, model, 296)
    rc = capture_stream(
        url,
        network,
        model_id = 56,
        network_type = 'object_recognition',
        input_fps = None,
        output_fps = 1,
        width = 1920,
        height = 1080,
        name = 'cmd_line_test_stream',
        social_distance = False,
        transformFn = None,
        cuda = True
    )

    print('capture stream finished with rc', rc)
    return rc

if __name__ == "__main__":
    sys.exit(main())
