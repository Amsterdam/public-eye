import os

from eelib.ml_object_recognition.models import Darknet

def GARB():
    return Darknet(os.environ['EAGLE_EYE_PATH'] + '/eelib/ml_object_recognition/model_configs/yolov3_garb.cfg')
