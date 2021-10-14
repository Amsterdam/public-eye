from eelib.ml.initialize_module import initialize_module
from eelib.job import parse_arguments
from eelib.ml_density.train import Trainer


def get_main(
    args_file,
    script_name,
    model_constructor,
    criterion,
    optimizer_constructor,
    scheduler_constructor,
    config_constructor
):
    @parse_arguments(args_file)
    def main(arguments):
        training_run, model, args = initialize_module(
            arguments, model_constructor)
        optimizer = optimizer_constructor(model, args)
        scheduler = scheduler_constructor(optimizer, args)

        config = config_constructor(args, criterion, optimizer, scheduler)
        tr = Trainer(
            model,
            args,
            config,
            script_name,
            training_run.id,
            training_run.log_file_path
        )
        tr.train()

    return main
