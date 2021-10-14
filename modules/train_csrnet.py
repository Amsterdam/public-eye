from eelib.ml.initialize_module import initialize_module
from eelib.ml_density.train_configs.csrnet_config import (
    Config
)
from eelib.ml_density.train import Trainer
from eelib.job import parse_arguments

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


@parse_arguments('modules/train_csrnet-args.json')
def main(args):
    training_run, model, args = initialize_module(
        'CSRNet', args)
    config = Config(model, args)

    tr = Trainer(
        model,
        args,
        config,
        'CSRNet',
        training_run.id,
        training_run.log_file_path
    )
    tr.train()

if __name__ == "__main__":
    main()
