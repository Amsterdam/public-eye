import sys
import os
import glob
import requests
from datetime import datetime, timezone
import cv2
import math
import time
import torch
import PIL.Image as Image
import PIL.ImageDraw as ImageDraw
import PIL.ImageFont as ImageFont
import subprocess
import numpy as np
from eelib.ml_line_crossing_density.utils import flo_to_color
import eelib.stream.global_variables as global_variables


MAX_TIMEOUT = 100
RESTART_MAXIMUM = 2 ** 4
FFMPEG_TIMEOUT = 10


def remove_stream_files(name):
    stream_files = glob.glob(os.path.join(
        os.environ['EAGLE_EYE_PATH'],
        'files',
        'streams',
        '{}*'.format(name)))

    for filename in stream_files:
        try:
            os.unlink(filename)
        except Exception:
            print('Something went wrong removing file: ', filename)


def set_selected_gpu(selected_gpu, cuda):
    if selected_gpu is not None and cuda:
        if (selected_gpu + 1) > torch.cuda.device_count():
            print('Exiting... Selected gpu is not available')
            sys.exit(1)

        torch.cuda.set_device(selected_gpu)
        print('set selected gpu', selected_gpu)


def get_argument(stream_index, key, objects):
    objects[stream_index][key]
    try:
        return objects[stream_index][key]
    except:
        return None


def load_font(output_height):
    try:
        # this causes some issues using wsl on windows
        return ImageFont.truetype(
            'Pillow/Tests/fonts/FreeMono.ttf', math.floor(output_height / 14))
    except:
        return ImageFont.load_default()


def create_heatmap(dens_map):
    dens_map[dens_map < 0] = 0
    dens_image = cv2.applyColorMap(
        ((dens_map / np.max(dens_map)) * 255).astype(np.uint8),
        cv2.COLORMAP_JET)
    return dens_image


def create_flow_heatmap(flow_map):
    return np.uint8(flo_to_color(flow_map))


def concat_heatmap_to_output(output, dens_map, flow_map=None):
    dens_image = create_heatmap(dens_map)
    output = np.concatenate(
        (output, np.array(dens_image)), axis=1)

    if flow_map is not None:
        fe_image = np.uint8(flo_to_color(flow_map))
        output = np.concatenate((output, fe_image), axis=1)

    return output


def extract_resolution(stream_url):
    try:
        command = [
            'ffprobe', '-v', 'error', '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height', '-of', 'csv=s=x:p=0',
            stream_url]
        pipe = subprocess.Popen(command, stdout=subprocess.PIPE)
        ffmpeg_output, _ = pipe.communicate(timeout=FFMPEG_TIMEOUT)
        pipe.kill()
        width, height = ffmpeg_output.decode("utf-8").replace('\n', '').split('x')
        return int(width), int(height)
    except:
        print('Something went wrong extracting the resolution of stream: {}'.format(stream_url))
        sys.exit(1)


def draw_on_output(output, text, lines=[]):
    output = np.array(output)
    output_height, output_width, _ = output.shape

    fnt = load_font(output_height)
    txt = Image.new('RGBA', (output_width, output_height), (255, 255, 255, 0))
    drawing_context = ImageDraw.Draw(txt)

    box_width = math.floor(output_width / 2)
    drawing_context.rectangle(
        ((0, 0), (box_width, math.floor(output_height / 8))),
        fill="white")
    drawing_context.text((10, 5), text, font=fnt, fill=(255, 0, 0, 255))

    for line_points in lines:
        point1 = (
            int(line_points[0][0]*output_width),
            int(line_points[0][1]*output_height)
        )
        point2 = (
            int(line_points[1][0]*output_width),
            int(line_points[1][1]*output_height)
        )
        drawing_context.line([point1, point2], fill=(255, 0, 0, 255), width=10)

    output = Image.alpha_composite(
        Image.fromarray(output.astype(np.uint8))
        .convert('RGBA'), txt).convert('RGB')

    return output


def stop_stream():
    # global g_run_capture
    global_variables.g_run_capture = False


def stop_multistream():
    # global g_run_capture
    global_variables.g_run_capture = False
    if global_variables.waiter:
        global_variables.waiter.set()


def make_callback_payload(
    people_count,
    prediction_type,
    violations=None
):
    payload = {
        'count': float(people_count),
        'time': str(datetime.now()),
        'prediction_type': prediction_type
    }
    if violations is not None:
        payload["violations"] = violations

    return payload


def rescale_output(output, scale_factor):
    output_height, output_width, _ = output.shape
    scaled_width = int(output_width * scale_factor)
    scaled_height = int(output_height * scale_factor)
    return cv2.resize(np.float32(output), (scaled_width, scaled_height))


def reconnect(cap, url, reconnect_time_out=2):
    if not global_variables.g_run_capture:
        return None, False

    try:
        # free up the previous binding to connection
        cap.release()
        # reconnect
        cap = cv2.VideoCapture(url)
        assert cap.isOpened(), "Reconnection failed"
        print('Succesfully reconnected')
        return True, cap
    except:
        if reconnect_time_out == RESTART_MAXIMUM:
            print('Maximum number of restarts reached. exiting...')
            stop_stream()
            return False, None

        print('Reconnecting not succesful. Trying again in {} seconds'.format(reconnect_time_out))
        time.sleep(reconnect_time_out)
        return reconnect(cap, url,  min(MAX_TIMEOUT, reconnect_time_out * 2))


def get_utc_timestamp():
    return datetime.now(timezone.utc)


def output_consumer_loop(function):
    def wrapper(
        outputq,
        framewriteq,
        stream_server,
        arguments,
        on_predict_callback=None,
    ):
        try:
            if stream_server:
                stream_server.start_server()

            while global_variables.g_run_capture:
                should_continue = function(
                    outputq,
                    framewriteq,
                    stream_server,
                    arguments,
                    on_predict_callback
                )
                if not should_continue:
                    break

        except Exception as e:
            print("Exiting because of error output thread:", e)
            stop_stream()
            if framewriteq:
                framewriteq.put_nowait(None)
        finally:
            if framewriteq:
                framewriteq.put_nowait(None)
            print('Output consumer finished')

    return wrapper


def open_capture(url):
    cap = cv2.VideoCapture(url)
    if cap.isOpened():
        width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        fps = cap.get(cv2.CAP_PROP_FPS)
        return cap, int(width), int(height), fps

    print("cannot open stream")
    sys.exit(1)


def frame_consumer_thread(frameq, predictq, scale_factor=1.0):
    while global_variables.g_run_capture:
        data = frameq.get(block=True)
        if data is None or global_variables.g_run_capture is False:
            print("stop frame_consumer_thread")
            predictq.put_nowait(None)
            break

        frame = data['frame']

        if 'scale_factor' in data and data['scale_factor']:
            scale_factor = data['scale_factor']

        if scale_factor != 1.0:
            image = Image.fromarray(frame)
            new_width, new_height = int(
                image.width * scale_factor), int(image.height * scale_factor)
            frame = np.array(
                image.resize((new_width, new_height), resample=Image.LANCZOS))

        # transform to numpy image and do colorspace conversion to BGR2RGB
        numpyImage = Image.fromarray(frame)
        predictq.put_nowait({
            'frame_num': data['frame_num'],
            'frame': frame,
            'image': numpyImage,
            'url': data['url'],
            'stream_name': data['stream_name'],
            'model_name': data['model_name'],
            'stream_index': data['stream_index'],
        })


def publish_callback(callback_urls, publish_data):
    if callback_urls is None:
        return

    for url in callback_urls.split(';'):
        if url == '':
            continue
        try:
            requests.post(url, json=publish_data)
        except Exception as e:
            print("ERROR AT WEBHOOK", url, "Error", e)
