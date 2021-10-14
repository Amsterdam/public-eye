import sys
import torch
import eelib.job as job
import eelib.store as store
from eelib.networks.registry import get_network
from eelib.ml_density.utils import load_model_from_checkpoint

def get_model_path(args):
    model_path = None
    if 'pretrained_model_id' in args and args["pretrained_model_id"]:
        pretrained_model = store.get_model_by_id(
            args["pretrained_model_id"])
        model_path = pretrained_model.path

    return model_path


def initialize_module(
    network_name,
    args,
):
    job_id = job.get_job_id()
    selected_gpu = job.get_or_default('selected_gpu', 0)
    if selected_gpu:
        if (selected_gpu + 1) > torch.cuda.device_count():
            print('selected gpu is not available')
            sys.exit(1)

        torch.cuda.set_device(selected_gpu)

    training_run = store.get_training_run_by_job_id(job_id)
    model_path = get_model_path(args)
    model = get_network(
        network_name,
        True,
        model_path,
        selected_gpu,
        args['train_last_layers']
    )

    return training_run, model, args
