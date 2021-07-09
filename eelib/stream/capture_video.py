import queue
import threading
from eelib.stream.stream_utils import (
    frame_consumer_thread,
    open_capture
)
from eelib.stream.stream_server import save_image_thread
from eelib.stream.capture import start_capture


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
    frameq = queue.Queue(maxsize=0)
    framewriteq = queue.Queue(maxsize=0)

    frame_consumer = threading.Thread(
        target=frame_consumer_thread,
        args=[frameq, framewriteq, scale_factor],
        daemon=True
    )
    save_image_consumer = threading.Thread(
        target=save_image_thread,
        args=[framewriteq, arguments],
        daemon=True
    )

    cap, opencv_width, opencv_height, opencv_fps = open_capture(stream)
    input_fps = input_fps or opencv_fps

    frame_consumer.start()
    save_image_consumer.start()
    start_capture(
        frameq=frameq,
        cap=cap,
        url=stream,
        model_name="only_capture",
        input_fps=input_fps,
        output_fps=output_fps,
        stream_name=name
    )
    frame_consumer.join()
    save_image_consumer.join()
