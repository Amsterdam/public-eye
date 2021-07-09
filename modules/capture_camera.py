import signal
import eelib.job as job
from eelib.stream.capture_video import capture_video
from eelib.stream.stream_utils import stop_stream


def sigint_handler(sig, frame):
    print('got sigint. stop input stream')
    stop_stream()


def main():
    signal.signal(signal.SIGINT, sigint_handler)
    stream = job.get_or_fail('stream')
    name = job.get_or_fail('name')
    scale_factor = job.get_or_default('scale_factor', 1.0)
    output_scale_factor = job.get_or_default('output_scale_factor', None)
    output_fps = job.get_or_default('output_fps', 1)
    input_fps = job.get_or_default('input_fps', None)
    print("stream", stream)

    capture_video(
        name,
        stream,
        scale_factor,
        input_fps,
        output_fps,
        output_scale_factor
    )


main()
