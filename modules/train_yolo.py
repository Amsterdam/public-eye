import os
from eelib.ml_object_recognition.models import Darknet
from eelib.ml.initialize_module import initialize_module
from eelib.ml_object_recognition.train_network import train
from eelib.job import parse_arguments


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


@parse_arguments('modules/train_yolo-args.json')
def main(arguments):
    training_run, model, args = initialize_module(
        'Yolo v3', arguments)
    train(
        model,
        args,
        training_run.id,
        training_run.log_file_path,
        "Yolo v3"
    )

if __name__ == "__main__":
    main()