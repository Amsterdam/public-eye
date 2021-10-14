import queue
import threading
import eelib.store as store
import eelib.job as job
from eelib.websocket import send_websocket_message
from eelib.stream.stream_utils import (
    frame_consumer_thread,
    open_capture,
    rescale_output,
    output_consumer_loop,
    get_argument,
    remove_stream_files,
    stop_stream
)
from eelib.stream.stream_server import save_image_thread, StreamServer
from eelib.stream.capture import start_capture
import eelib.stream.global_variables as global_variables


def clean_up_video_capture(name):
    video_capture = store.get_video_capture_by_name(name)
    if video_capture:
        store.update_video_capture_stream_path(
            video_capture.running_job_id, None)

    remove_stream_files(name)
    video_capture = store.get_video_capture_with_job_by_job_id_as_dict(
        video_capture.running_job_id
    )
    return video_capture


def predict_consumer_thread(
    predictq,
    outputq,
):
    try:
        while global_variables.g_run_capture:
            data = predictq.get(block=True)
            if data is None or global_variables.g_run_capture is False:
                print("stop predict consumer thread")
                outputq.put_nowait(None)
                break

            outputq.put_nowait({
                'frame': data['frame'],
                'stream_index': data['stream_index'],
                'frame_num': data['frame_num']
            })
    except Exception as e:
        print("Exiting because of error in predict thread: ", e)
        stop_stream()
        outputq.put_nowait(None)
    finally:
        outputq.put_nowait(None)


@output_consumer_loop
def output_consumer_thread(
    outputq,
    framewriteq,
    stream_server,
    arguments,
    on_predict_callback,
) -> bool:
    data = outputq.get(block=True)
    if data is None or global_variables.g_run_capture is False:
        return False

    image = data['frame']
    output = image
    output_scale_factor = get_argument(
        data['stream_index'], 'output_scale_factor', arguments)
    output = (
        output if not output_scale_factor
        else rescale_output(
            output, output_scale_factor)
    )
    framewriteq.put_nowait({
        'frame': data['frame'],
        'stream_index': data['stream_index'],
        'frame_num': data['frame_num']
    })
    stream_server.push_image(output)

    print('written ({} items left)'.format(outputq.qsize()))
    return True


def capture_video(
    name,
    stream,
    scale_factor,
    input_fps,
    output_fps,
    output_scale_factor
):
    arguments = [{
        'stream': stream,
        'input_fps': input_fps,
        'output_fps': output_fps,
        'name': name,
        'output_scale_factor': output_scale_factor,
        'scale_factor': scale_factor,
    }]

    def save_function(name, encoded_file_name):
        job_id = job.get_job_id()
        store.update_video_capture_stream_path(job_id, encoded_file_name)
        video_capture = store.get_video_capture_with_job_by_job_id_as_dict(
            job_id)
        if video_capture:
            send_websocket_message(
                'video-capture',
                'update',
                video_capture)

    cap, opencv_width, opencv_height, opencv_fps = open_capture(stream)
    input_fps = input_fps or opencv_fps
    stream_server = StreamServer(
       scale_factor,
       output_scale_factor,
       opencv_height,
       opencv_width,
       output_fps,
       name,
       save_function
    )

    frameq = queue.Queue(maxsize=0)
    framewriteq = queue.Queue(maxsize=0)
    predictq = queue.Queue(maxsize=0)
    outputq = queue.Queue(maxsize=0)

    frame_consumer = threading.Thread(
        target=frame_consumer_thread,
        args=[frameq, predictq, scale_factor],
        daemon=True
    )
    save_image_consumer = threading.Thread(
        target=save_image_thread,
        args=[framewriteq, arguments],
        daemon=True
    )
    predict_consumer = threading.Thread(
        target=predict_consumer_thread,
        args=[predictq, outputq]
    )
    output_consumer = threading.Thread(
        target=output_consumer_thread,
        args=[outputq, framewriteq, stream_server, arguments, None],
        daemon=True
    )

    frame_consumer.start()
    predict_consumer.start()
    output_consumer.start()
    save_image_consumer.start()
    print("START ALL THREADS")

    start_capture(
        frameq=frameq,
        cap=cap,
        url=stream,
        model_name="only_capture",
        input_fps=input_fps,
        output_fps=output_fps,
        stream_name=name
    )

    print('wait for join()')
    frame_consumer.join()
    predict_consumer.join()
    output_consumer.join()
    save_image_consumer.join()

    video_capture = clean_up_video_capture(name)
    send_websocket_message(
        'video-capture',
        'update',
        video_capture)

    stream_server.close_server()

    return 0
