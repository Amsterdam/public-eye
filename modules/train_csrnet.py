import torch
import eelib.ml.standard_transform as transform
from eelib.networks.CSRNet.model import CSRNet
from eelib.ml_density.utils import load_data
from eelib.ml_density.train_model_template import get_main

"""
example
{
   "scriptName" : "train_csrnet.py",
   "scriptArgs": {
        "train_dataset_id": 16,
        "val_dataset_id": 17,
        "epochs": 1
    }
}
"""

criterion = torch.nn.MSELoss(size_average=False).cuda()


def optimizer_constructor(model, args):
    return torch.optim.SGD(filter(lambda p: p.requires_grad, model.parameters()),
                           args['lr'],
                           momentum=args['momentum'],
                           weight_decay=args['decay'])


def scheduler_constructor(optimizer, args):
    return torch.optim.lr_scheduler.MultiStepLR(
        optimizer,
        gamma=args['gamma'],
        milestones=args['steps']
    )


main = get_main(
    args_file="modules/train_csrnet-args.json",
    script_name="train_csrnet.py",
    model_constructor=CSRNet,
    criterion=criterion,
    optimizer_constructor=optimizer_constructor,
    scheduler_constructor=scheduler_constructor,
    load_data=load_data,
    transform=transform.standard_transform
)

main()
