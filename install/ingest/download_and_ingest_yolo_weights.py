import wget
import eelib.store as store
import eelib.postgres as pg
import os
from utils import random_hex


pg.connect()
url = 'https://pjreddie.com/media/files/yolov3.weights'
output_file = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'models', 'pretrained_yolov3.weights')
wget.download(url, output_file)
nn = store.get_neural_network_by_script("train_yolo.py")
store.insert_model("pretrained_yolov3", nn.id, output_file)
model = store.get_model_by_name("pretrained_yolov3")

with open(os.path.join(os.environ['EAGLE_EYE_PATH'], 'install', 'ingest', 'coco.names')) as f:
    for idx, label_name in enumerate(f.readlines()):
        rgb = random_hex()
        label_name = label_name.replace('\n', '')
        store.insert_label_if_not_exists(label_name, rgb)
        label = store.get_label_by_name(label_name)
        store.insert_selected_label_if_not_exists(model.id, label.id, idx)
