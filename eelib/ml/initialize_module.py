import sys
import torch
import eelib.job as job
import eelib.store as store
from eelib.ml_density.utils import load_model_from_checkpoint


def initialize_module(
    args,
    model_constructor,
):
    job_id = job.get_job_id()
    selected_gpu = job.get_or_default('selected_gpu', None)
    if selected_gpu:
        if (selected_gpu + 1) > torch.cuda.device_count():
            print('selected gpu is not available')
            sys.exit(1)

        torch.cuda.set_device(selected_gpu)

    training_run = store.get_training_run_by_job_id(job_id)
    model = model_constructor(args)

    if 'pretrained_model_id' in args and args["pretrained_model_id"]:
        pretrained_model = store.get_model_by_id(
            args["pretrained_model_id"])
        load_model_from_checkpoint(pretrained_model.path, model)
        print("loaded pretrained model")
        if 'train_last_layers' in args and args["train_last_layers"]:
            parameters = list(model.parameters())
            # disable all layers
            for param in parameters:
                param.requires_grad = False

            # enable train_last_layers
            rev = list(reversed(parameters))
            for i in range(
                0,
                min(len(rev) - 1, args["train_last_layers"] + 1)
            ):
                param = rev[i]
                param.requires_grad = True

    model.cuda()
    return training_run, model, args
