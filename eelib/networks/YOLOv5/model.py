import os, torch, sys
from eelib.networks.YOLOv5.models.experimental import attempt_load

sys.path.append(os.path.join(os.environ['EAGLE_EYE_PATH'], 'eelib', 'networks', 'YOLOv5'))

def YOLOv5():
    return attempt_load([os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'models', 'yolov5s.pt')])
