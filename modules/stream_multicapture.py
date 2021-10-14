import sys
import signal
import torch

import eelib.job as job
import eelib.postgres as pg
from eelib.stream.multicapture import multicapture_stream
from eelib.stream.stream_utils import stop_multistream
import eelib.store as store
from eelib.networks.registry import get_network
from eelib.ml.standard_transform import standard_transform
from eelib.stream.stream_utils import publish_callback, set_selected_gpu
from eelib.websocket import send_websocket_message


def sigint_handler(sig, frame):
    print('got sigint. stop input stream')
    stop_multistream()

"""
example
{
   "scriptName" : "stream_multicapture.py",
   "scriptArgs": {
        "args": [
            {
                "name": "",
                "stream": "rtsp://ID-1C21D1C300C6.rtsp.umbocv.camera:8554/livehd/ID-1C21D1C300C6/_ZuuaI8ig",
                "network": 1,
                "social_distance": false,
                "cuda": true,
                "input_fps": 25,
                "output_fps": 1,
                "width": 500,
                "height": 500,
                "model": 8,
                "bias": "",
                "show_heatmap": true,
                "object_threshold": "",
                "non_max_suppression": "",
                "sliding_window": "",
                "callback_urls": "http://localhost:3333/debug/1;http://localhost:3333/debug/3",
                "selected_gpu": null,
                "save_images": false,
                "scale_factor": 1,
                "roi_id": 5
            },
            {
                "name": "",
                "stream": "rtsp://ID-1C21D1C300C6.rtsp.umbocv.camera:8554/livehd/ID-1C21D1C300C6/_ZuuaI8ig",
                "network": 1,
                "social_distance": false,
                "cuda": true,
                "input_fps": 25,
                "output_fps": 1,
                "width": 100,
                "height": 100,
                "model": 8,
                "bias": "",
                "show_heatmap": true,
                "object_threshold": "",
                "non_max_suppression": "",
                "sliding_window": "",
                "callback_urls": "http://localhost:3333/debug/2",
                "selected_gpu": null,
                "save_images": false,
                "scale_factor": 1,
                "roi_id": ""
            }
        ]
    }
}
"""

args_schema = [
    ('model', True, None),
    ('network', True, None),
    ('stream', True, None),
    ('name', False, ''),
    ('social_distance', False, False),
    ('callback_urls', False, None),
    ('cuda', False, True),
    ('width', False, None),
    ('height', False, None),
    ('output_fps', False, 1),
    ('input_fps', False, None),
    ('roi_id', False, None),
    ('bias', False, 0),
    ('show_heatmap', False, False),
    ('non_max_suppression', False, None),
    ('object_threshold', False, None),
    ('sliding_window', False, 1),
    ('area_size_m2', False, None),
    ('selected_gpu', False, 0),
    ('save_images', False, False),
    ('scale_factor', False, 1.0),
    ('save_every', False, None)
]


def main():
    signal.signal(signal.SIGINT, sigint_handler)

    pg.connect()
    args = job.get_array_or_fail(args_schema, 'args')
    name = job.get_or_fail('name')
    job_id = job.get_job_id()
    new = store.insert_multicapture_stream_if_not_exists(name, job_id)
    multi_capture = store.get_multi_capture_by_job_id_as_dict(job_id)
    send_websocket_message(
        'multi-capture',
        'new' if new else 'update',
        multi_capture
    )

    for stream_args in args:
        camera = store.get_camera_by_stream_url(stream_args['stream'])
        store.insert_camera_multicapture_link_if_not_exists(
            camera.id, multi_capture['id'])

    model = store.get_model_by_id(args[0]['model'])
    network = store.get_neural_network_by_id(model.neural_network_id)
    neural_network_type = store.get_nn_type_by_id(network.nn_type_id)

    set_selected_gpu(args[0].get('selected_gpu'), args[0].get('cuda'))

    cuda_net = get_network(
        network.train_script,
        cuda=args[0]['cuda'],
        model_path=model.path)

    def get_area_points(stream_index):
        roi_id = args[stream_index].get('roi_id')
        if not roi_id:
            return None

        stream_roi = store.get_stream_roi_by_id(roi_id)
        if stream_roi is None:
            print('Stream roi does not exist, exiting...!')
            stop_multistream()
            raise Exception('Stream roi does not exist')

        camera = store.get_camera_by_id(stream_roi.camera_id)
        if camera is None:
            print('Camera does not exist yet, exiting...!')
            stop_multistream()
            raise Exception('Camera does not exist yet')

        if camera.stream_url != args[stream_index].get('stream'):
            print('Region of interest belongs to a different stream, exiting...!')
            stop_multistream()
            raise Exception('Region of interest belongs to a different stream')

        roi = store.get_stream_roi_by_id(roi_id)
        if roi is None:
            print("Selected roi does not exist")
            stop_multistream()
            raise Exception('Selected roi does not exist')

        return roi.polygons

    # function to swap models
    def get_model(stream_index):
        set_selected_gpu(
            args[stream_index].get('selected_gpu'),
            args[stream_index].get('cuda'))
        model_id = args[stream_index]['model']
        model = store.get_model_by_id(model_id)
        cuda = args[stream_index]['cuda']

        nn = get_network(
            network.name,
            cuda,
            model.path,
            args[stream_index].get('selected_gpu')
        )

        return nn

    def predict_callback_handler(payload, stream, model_name, stream_index):
        try:
            model_id = args[stream_index]['model']
            model = store.get_model_by_id(model_id)
            network = store.get_neural_network_by_id(model.neural_network_id)
            neural_network_type = store.get_nn_type_by_id(network.nn_type_id)
            callback_urls = args[stream_index].get('callback_urls')
            publish_data = {
                'stream_url': stream,
                'network_type': neural_network_type.name,
                'network': network.train_script,
                'payload': payload,
                'model': model_name,
                'stream_name': name,
                'event_name': 'UPDATE'
            }
            camera = store.get_camera_by_stream_url(stream)

            if camera.area_size_m2:
                publish_data['area_size_m2'] = float(camera.area_size_m2)

            publish_callback(callback_urls, publish_data)

        except Exception as e:
            print("ERROR PUBLISHING ", e)

    multicapture_stream(
        args,
        standard_transform,
        get_model,
        get_area_points=get_area_points,
        on_predict_callback=predict_callback_handler,
        neural_network_type=neural_network_type.name
    )


sys.exit(main())
