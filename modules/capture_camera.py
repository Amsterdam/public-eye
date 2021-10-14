import signal
import eelib.job as job
import eelib.store as store
from eelib.stream.capture_video import capture_video
from eelib.stream.stream_utils import stop_stream
from eelib.websocket import send_websocket_message


def sigint_handler(sig, frame):
    print('got sigint. stop input stream')
    stop_stream()


def main():
    signal.signal(signal.SIGINT, sigint_handler)
    job_id = job.get_job_id()
    stream = job.get_or_fail('stream')
    name = job.get_or_fail('name')
    scale_factor = job.get_or_default('scale_factor', 1.0)
    output_scale_factor = job.get_or_default('output_scale_factor', None)
    output_fps = job.get_or_default('output_fps', 1)

    video_capture = store.get_video_capture_by_name(name)
    store.insert_camera_if_not_exists(stream)
    camera = store.get_camera_by_stream_url(stream)
    input_fps = camera.fps

    if video_capture is None:
        store.insert_video_capture(job_id, name, camera.id)
        video_capture = store.get_video_capture_with_job_by_job_id_as_dict(
            job_id
        )
        send_websocket_message('stream-instance', 'new', video_capture)
    else:
        video_capture = store.get_video_capture_with_job_by_job_id_as_dict(
            job_id
        )
        send_websocket_message('stream-instance', 'update', video_capture)

    capture_video(
        name,
        stream,
        scale_factor,
        input_fps,
        output_fps,
        output_scale_factor
    )


main()
