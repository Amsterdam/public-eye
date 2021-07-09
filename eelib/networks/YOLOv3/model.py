import os

from eelib.ml_object_recognition.models import Darknet

def YOLOv3():
    return Darknet(os.environ['EAGLE_EYE_PATH'] + '/eelib/ml_object_recognition/model_configs/yolov3.cfg')
