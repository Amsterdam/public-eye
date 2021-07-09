import sys
import time
import os
import uuid
import json
import eelib.store as store
from eelib.ml.initialize_module import initialize_module
from eelib.job import parse_arguments
from eelib.ml_line_crossing_density.train import (
    train, load_model, save_checkpoint
)
from eelib.websocket import send_websocket_message


@parse_arguments('modules/train_loi_density-args.json')
def main(arguments):
    training_run, model, args = initialize_module(arguments, load_model)
    job_id = sys.argv[1]
    args['dataset'] = args['train_dataset_id']

    if not args.get('seed'):
        args['seed'] = time.time()

    config_path = (
        os.environ['EAGLE_EYE_PATH'] +
        '/files/configs/{}.json'.format(uuid.uuid4())
    )

    with open(config_path, 'w') as f:
        json.dump(args, f)

    config_id = store.insert_train_config(config_path)
    model_filename = save_checkpoint(model)
    args['model_filename'] = model_filename
    neural_network = store.get_neural_network_by_script("train_loi_density.py")
    model_id = store.insert_model(
        args["model_name"], neural_network.id, model_filename)
    training_run = store.get_training_run_by_job_id(job_id)
    args['run_id'] = training_run.id
    args['log_file_path'] = training_run.log_file_path
    args['job_id'] = job_id
    store.update_train_run(
        training_run.id,
        model_id,
        config_id
    )
    updated_training_run = store.get_train_run_by_id_as_dict(training_run.id)
    updated_training_run["date"] = updated_training_run["date"].isoformat()
    send_websocket_message('training-run', 'update', updated_training_run)

    train(model, args)


main()
