from eelib.ml.initialize_module import initialize_module
from eelib.job import parse_arguments
from eelib.ml_density.train import Trainer
from eelib.ml_density.train_configs.transformer_config import Config

"""
example
{
   "scriptName" : "train_vicct.py",
   "scriptArgs": {
        "train_dataset_id": 16,
        "val_dataset_id": 17,
        "epochs": 1
    }
}
"""


@parse_arguments('modules/train_vicct-args.json')
def main(args):
    training_run, model, args = initialize_module(
        'VICCT', args)
    config = Config(model, args)

    tr = Trainer(
        model,
        args,
        config,
        'VICCT',
        training_run.id,
        training_run.log_file_path
    )
    tr.train()

if __name__ == "__main__":
    main()