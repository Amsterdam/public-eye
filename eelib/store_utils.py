import uuid
import os
import json
import datetime
import sys
from datetime import datetime, timezone 
import eelib.store as store
import eelib.ml_density.ground_truth as gt

def store_run(model_name, script_name, run_id, model_id, scores, config):
    config_path = os.environ['EAGLE_EYE_PATH'] + '/files/configs/{}.json'.format(uuid.uuid4())

    with open(config_path, 'w') as f:
        json.dump(config, f)

    for score in scores:
        store.insert_score(score['name'], score['value'], run_id)

    config_id = store.insert_train_config(config_path)
    store.update_train_run(
        run_id,
        model_id,
        config_id
    )

def ensure_gt_dir_exists(gt_path):
    gt_dir = os.path.dirname(gt_path)
    if not os.path.isdir(gt_dir):
        os.makedirs(gt_dir)

def make_gt_path():
    file_id = str(uuid.uuid4())
    ee_path = os.environ['EAGLE_EYE_PATH']
    return (
        os.path.join(ee_path, 'files/gts', file_id) + '.h5',
        os.path.join(ee_path, 'files/gts',  file_id) + '.jpg'
    )

def handle_create_gt_from_frame(frame_id, dataset, sigma, beta):
    print('create gt for frame {}'.format(frame_id))
    frame = store.get_frame_by_id(frame_id)
    print(frame)

    gt_path, gt_render_path = make_gt_path()

    ensure_gt_dir_exists(gt_path)

    ground_truth = gt.gt_from_frame(frame, sigma, beta)

    print('add db entry')
    stored = store.insert_gt(frame_id, dataset.id, gt_path, gt_render_path)
    if not stored:
        print('error storing gt')
        sys.exit(1)

    print('write to disc {}'.format(gt_path))


    # store file
    gt.store_gt(gt_path, ground_truth)

    # store image
    print('write to disc {}'.format(gt_render_path))
    gt.store_gt_render(gt_render_path, ground_truth)

def get_utc_timestamp():
    return datetime.now(timezone.utc).timestamp()
