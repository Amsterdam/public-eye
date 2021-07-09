import os
import json

def load():
    eepath = os.environ['EAGLE_EYE_PATH']
    config_path = os.path.join(eepath, 'config.json')
    with open(config_path, 'r') as cfg_file:
        return json.load(cfg_file)

