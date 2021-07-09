import os
import subprocess
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer
import cv2
import time
import eelib.stream.global_variables as global_variables
from eelib.websocket import send_websocket_message
import eelib.store as store
from eelib.stream.stream_utils import (
    stop_stream,
    get_argument
)

# One Hour
MAXIMUM_SECONDS_VIDEO = 3600


def scale_width_or_height(value, input_scale_factor, output_scale_factor):
    return int(value * (input_scale_factor or 1) * (output_scale_factor or 1))


def build_ffmpeg_command(
    input_scale_factor,
    output_scale_factor,
    height,
    width,
    fps,
    stream_name,
    show_heatmap
):
    return [
        'ffmpeg',
        '-loglevel', 'quiet',
        '-re',
        '-r',
        str(fps),
        '-s',
        '{}x{}'.format(
            scale_width_or_height(
                width, input_scale_factor, output_scale_factor),
            scale_width_or_height(
                height, input_scale_factor, output_scale_factor)),
        '-i',
        'pipe:',
        '-c:v',
        'libx264',
        '-tune',
        'zerolatency',
        '-preset',
        'ultrafast',
        '-g',
        '25',
        '-an',
        '-pix_fmt',
        'yuv420p',
        '-f',
        'hls',
        '-hls_flags',
        'delete_segments',
        '-hls_time',
        '4',
        stream_name
    ]


class EventHandler(FileSystemEventHandler):
    def __init__(self, observer, filename, callback):
        self.observer = observer
        self.filename = filename
        self.callback = callback

    def on_created(self, event):
        if event.src_path.replace('.tmp', '') == self.filename:
            self.callback()
            self.observer.unschedule_all()
            self.observer.stop()


class StreamServer:

    def __init__(
        self,
        input_scale_factor,
        output_scale_factor,
        height,
        width,
        fps,
        name,
        show_heatmap
    ):
        print(f"Starting stream with resolution {height}x{width}")
        stream_folder = os.path.join(
            os.environ['EAGLE_EYE_PATH'], 'files', 'streams')
        encoded_file_name = '{}.m3u8'.format(name)
        stream_name = os.path.join(stream_folder, encoded_file_name)

        self.ffmpeg_command = build_ffmpeg_command(
            input_scale_factor,
            output_scale_factor,
            height,
            width,
            fps,
            stream_name,
            show_heatmap
        )
        self.restart_timeout = 2

        stream_instance = store.get_stream_instance_by_name(name)

        if stream_instance is not None:
            def save_function():
                stream_instance = store.get_stream_instance_by_name(name)
                store.save_stream_name(stream_instance.id, encoded_file_name)
                stream_instance = store.get_stream_instance_by_id_as_dict(stream_instance.id)
                send_websocket_message('stream-instance', 'update', stream_instance)

            observer = Observer()
            event_handler = EventHandler(observer, stream_name, save_function)
            observer.schedule(event_handler, stream_folder, recursive=False)
            observer.start()

    def start_server(self):
        print("starting server")
        self.process = subprocess.Popen(
            self.ffmpeg_command, stdin=subprocess.PIPE, close_fds=True)

    def push_image(self, img):
        ret2, frame2 = cv2.imencode('.png', img)
        try:
            if global_variables.g_run_capture:
                self.process.stdin.write(frame2.tobytes())
        except Exception as e:
            print(e)
            if global_variables.g_run_capture:
                print('Something went wrong communicating with FFMPEG... restarting FFMPEG in {0} seconds'.format(self.restart_timeout))
                time.sleep(self.restart_timeout)
                self.restart_timeout = self.restart_timeout * 2

                self.close_server()
                self.start_server()

    def close_server(self):
        print('close stdin')
        self.process.stdin.close()
        self.process.wait()
        print('exiting process FFMPEG', self.process.returncode)


def count_video_segment_with_prefix(path, prefix):
    return len([file for file in os.listdir(path) if file.startswith(prefix)])


def save_image_thread(framewriteq, arguments):
    def start_stream(data, video_number):
        camera = store.get_camera_by_stream_url(get_argument(
            data['stream_index'], 'stream', arguments))
        stream_name = get_argument(
            data['stream_index'], 'name', arguments)

        filename_prefix = f"{stream_name}_{camera.name}"
        path = os.path.join(
            os.environ['EAGLE_EYE_PATH'],
            'files',
            'videos',
        )
        video_count = count_video_segment_with_prefix(path, filename_prefix)
        filename = os.path.join(path, filename_prefix + f"_#{video_count}.mp4")

        ffmpeg_command = [
            'ffmpeg',
            '-loglevel',
            'quiet',
            '-r',
            str(get_argument(data['stream_index'], 'output_fps', arguments)),
            '-i',
            'pipe:',
            '-c:v',
            'libx264',
            '-pix_fmt',
            'yuv420p',
            filename
        ]
        process = subprocess.Popen(
            ffmpeg_command, stdin=subprocess.PIPE, close_fds=True)
        return process, filename, time.time(), camera

    def push_image(process, img):
        ret2, frame2 = cv2.imencode('.png', img)
        try:
            if global_variables.g_run_capture:
                process.stdin.write(frame2.tobytes())
        except Exception as e:
            print(e)
            if global_variables.g_run_capture:
                process.stdin.close()
                process.wait()

    ffmpeg_processes = {}

    def finish_video(ffmpeg_processes):
        for process, filename, _, camera in ffmpeg_processes.values():
            process.stdin.close()
            print('saving video', filename)
            video_file_id = store.insert_video_file_if_not_exists(filename)
            store.insert_video_captured_by_camera(video_file_id, camera.id)

    try:
        video_number = 0

        while global_variables.g_run_capture:
            data = framewriteq.get(block=True)
            if data is None or global_variables.g_run_capture is False:
                print("stop save image consumer")
                break

            if data['frame_num'] == 0:
                process, filename, start_time, camera = start_stream(
                    data, video_number)
                ffmpeg_processes[data['stream_index']] = (
                    process, filename, start_time, camera)

            start_time = ffmpeg_processes[data['stream_index']][2]
            if time.time() - start_time > MAXIMUM_SECONDS_VIDEO:
                finish_video(ffmpeg_processes)
                video_number += 1
                process, filename, start_time, camera = start_stream(
                    data, video_number)
                ffmpeg_processes[data['stream_index']] = (
                    process, filename, start_time, camera)

            push_image(
                ffmpeg_processes[data['stream_index']][0],
                data['frame'])

    except Exception as e:
        print("Exiting because of error save image thread:", e)
    finally:
        print('closing ')
        finish_video(ffmpeg_processes)
        stop_stream()
