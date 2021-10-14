import os
from eelib.ml_object_recognition.models import Darknet
from eelib.ml.initialize_module import initialize_module
from eelib.ml_object_recognition.train_network import train
from eelib.job import parse_arguments

default_args = {
    'epochs': 150,
    'batch_size': 6,
    'accumulate': 4,
    'img_size': [416],
    'rect': False,
    'multi_scale': False,
    'device': '',
    'cache_images': False,
    'notest': False,
    'nosave': False,
    'evolve': False,
    'adam': True,
    'cfg': os.environ['EAGLE_EYE_PATH'] + '/eelib/ml_object_recognition/model_configs/yolov3_garb.cfg'
}

"""
example
{
   "scriptName" : "train_yolo.py",
   "scriptArgs": {
        "train_dataset_id": 16,
        "val_dataset_id": 17,
        "epochs": 1
    }
}
"""


@parse_arguments('modules/train_garb-args.json')
def main(arguments):
    training_run, model, args = initialize_module(
        'Yolo v3 Garbage', arguments)
    train(
        model,
        args,
        training_run.id,
        training_run.log_file_path,
        "Yolo v3 Garbage"
    )

if __name__ == "__main__":
    main()