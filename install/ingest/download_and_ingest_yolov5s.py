import eelib.store as store
import eelib.postgres as pg
import os
import wget
from utils import random_hex

pg.connect()
url = 'https://github.com/ultralytics/yolov5/releases/download/v3.0/yolov5s.pt'
output_file = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'models', 'yolov5s.pt')
wget.download(url, output_file)
nn_type = store.get_nn_type_by_name('object_recognition')
store.insert_nn_if_not_exists('train_yolov5s.py', nn_type.id)
nn = store.get_neural_network_by_script("train_yolov5s.py")
store.insert_model("pretrained_small_yolov5s", nn.id, output_file)
model = store.get_model_by_name("pretrained_small_yolov5s")

with open(os.path.join(os.environ['EAGLE_EYE_PATH'], 'install', 'ingest', 'coco.names')) as f:
    for idx, label_name in enumerate(f.readlines()):
        rgb = random_hex()
        label_name = label_name.replace('\n', '')
        store.insert_label_if_not_exists(label_name, rgb)
        label = store.get_label_by_name(label_name)
        store.insert_selected_label_if_not_exists(model.id, label.id, idx)
