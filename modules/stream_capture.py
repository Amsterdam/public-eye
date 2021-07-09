import sys
import signal
import uuid
import time
import json
import requests
import torch

import eelib.job as job
import eelib.store as store
from eelib.websocket import send_websocket_message
from eelib.config import load
from eelib.stream.capture import capture_stream
from eelib.stream.stream_utils import stop_stream
from eelib.networks.registry import NNRegistry as ModelRegistry
from eelib.ml.standard_transform import standard_transform
from eelib.stream.stream_utils import publish_callback, set_selected_gpu

"""
example
{
   "scriptName" : "stream_capture.py",
   "scriptArgs": {
        "network": 1,
        "model": 1,
        "stream": "udp://@127.0.0.1:5010"
    }
}

network must be neural_network id
model must be model id
"""

def sigint_handler(sig, frame):
    print('got sigint. stop input stream')
    stop_stream()

def main():
    signal.signal(signal.SIGINT, sigint_handler)
    config = load()

    name = job.get_or_fail('name')

    model_id = job.get_or_fail('model')
    network_id = job.get_or_fail('network')
    stream = job.get_or_fail('stream')
    social_distance = job.get_or_default('social_distance', False)
    cuda = job.get_or_default('cuda', True)
    output_scale_factor = job.get_or_default('output_scale_factor', None)
    output_fps = job.get_or_default('output_fps', 1)
    input_fps = job.get_or_default('input_fps', None)
    roi_id = job.get_or_default('roi_id', None)
    loi_id = job.get_or_default('loi_id', None)
    density_bias = job.get_or_default('density_bias', 0)
    show_heatmap = job.get_or_default('show_heatmap', False)
    non_max_suppression = job.get_or_default('non_max_suppression', None)
    object_threshold = job.get_or_default('object_threshold', None)
    sliding_window = job.get_or_default('sliding_window', 1)
    area_size_m2 = job.get_or_default('area_size_m2', None)
    selected_gpu = job.get_or_default('selected_gpu', 0)
    save_images = job.get_or_default('save_images', False)
    scale_factor = job.get_or_default('scale_factor', 1.0)
    save_every = job.get_or_default('save_every', None)

    # comma separated
    callback_urls = job.get_or_default('callback_urls', '')

    print('run with webhook callbacks:', callback_urls)

    set_selected_gpu(selected_gpu, cuda)

    network = store.get_neural_network_by_id(network_id)
    if network is None:
        print('No network with id {}'.format(network_id))
        sys.exit(1)

    model = store.get_model_by_id(model_id)
    if model is None:
        print('No model with id {}'.format(model_id))
        sys.exit(1)

    if model.neural_network_id != network.id:
        print('Model {} is not a model for network {} - {}'.format(model_id, network_id, network.train_script))
        sys.exit(1)

    # confusing naming. model, network... phew.. tech debt he
    neural_network_type = store.get_nn_type_by_id(network.nn_type_id)

    cuda_net = ModelRegistry().get_network(
        network.train_script,
        cuda=cuda,
        cuda_device=selected_gpu,
        model_path=model.path,
        type=neural_network_type.name)

    if cuda_net is None:
        print('No registered cuda network code for {}'.format(network.train_script))
        sys.exit(1)

    job_id = job.get_job_id()
    stream_instance = store.get_stream_instance_by_name(name)
    store.insert_camera_if_not_exists(stream)
    camera = store.get_camera_by_stream_url(stream)
    input_fps = camera.fps

    if stream_instance is None:
        stream_instance_id = store.insert_stream_instance(name, camera.id, model.id, network.id, job_id)
        updated_stream_instance = store.get_stream_instance_by_id_as_dict(stream_instance_id)
        send_websocket_message('stream-instance', 'new', updated_stream_instance)
    else:
        updated_stream_instance = store.get_stream_instance_by_id_as_dict(stream_instance.id)
        send_websocket_message('stream-instance', 'update', updated_stream_instance)

    area_points = None
    if roi_id:
        stream_roi = store.get_stream_roi_by_id(roi_id)
        if stream_roi is None:
            print('Region of interest does not exist, exiting...!')
            sys.exit(1)

        camera = store.get_camera_by_id(stream_roi.camera_id)
        if camera is None:
            print('No camera for stream yet, exiting...!')
            sys.exit(1)

        if camera.stream_url != stream:
            print('Region of interest belongs to a different stream, exiting...!')
            sys.exit(1)

        area_points = stream_roi.polygons

    loi_points = None
    if loi_id:
        stream_loi = store.get_stream_loi_by_id(loi_id)
        if stream_loi is None:
            print('Line of interest does not exist, exiting...!')
            sys.exit(1)

        loi_points = stream_loi.polygons

    # stream_index argument needed for use with multicapture
    def predict_callback_handler(
        payload,
        stream,
        model_name,
        stream_index=None
    ):
        try:
            publish_data = {
                'stream_url': stream,
                'network_type': neural_network_type.name,
                'model': model_name,
                'network': network.train_script,
                'stream_name': name,
                'payload': payload,
                'event_name': 'UPDATE'
            }
            camera = store.get_camera_by_stream_url(stream)

            if camera.area_size_m2:
                publish_data['area_size_m2'] = float(camera.area_size_m2)

            publish_callback(callback_urls, publish_data)

        except Exception as e:
            print("ERROR PUBLISHING ", e)

    publish_data = {
        'stream_url': stream,
        'network_type': neural_network_type.name,
        'model': model.name,
        'network': network.train_script,
        'stream_name': name,
        'event_name': 'START'
    }
    publish_callback(callback_urls, publish_data)

    return_code = capture_stream(
        url=stream,
        network=cuda_net,
        model_id=model.id,
        model_name=model.name,
        network_type=neural_network_type.name,
        input_fps=input_fps,
        output_fps=output_fps,
        output_scale_factor=output_scale_factor,
        transformFn=standard_transform,
        name=name,
        social_distance=social_distance,
        cuda=cuda,
        on_predict_callback=predict_callback_handler,
        area_points=area_points,
        loi_points=loi_points,
        show_heatmap=show_heatmap,
        density_bias=density_bias,
        non_max_suppression=non_max_suppression,
        object_threshold=object_threshold,
        sliding_window=sliding_window,
        selected_device=selected_gpu,
        save_images=save_images,
        scale_factor=scale_factor,
        save_every=save_every)

    publish_data = {
        'stream_url': stream,
        'network_type': neural_network_type.name,
        'model': model.name,
        'network': network.train_script,
        'stream_name': name,
        'event_name': 'STOP'
    }
    publish_callback(callback_urls, publish_data)

    return return_code

sys.exit(main())
