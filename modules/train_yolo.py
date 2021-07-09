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
    def load_model(args):
        return Darknet(os.environ['EAGLE_EYE_PATH'] + '/eelib/ml_object_recognition/model_configs/yolov3.cfg')

    training_run, model, args = initialize_module(arguments, load_model)
    train(
        model,
        args,
        training_run.id,
        training_run.log_file_path,
        "train_yolo.py"
    )


main()
