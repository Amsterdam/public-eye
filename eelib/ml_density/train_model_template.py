from eelib.ml_density.train_network import train
from eelib.ml.initialize_module import initialize_module
from eelib.job import parse_arguments


def get_main(
    args_file,
    script_name,
    model_constructor,
    criterion,
    optimizer_constructor,
    scheduler_constructor,
    load_data,
    transform
):
    @parse_arguments(args_file)
    def main(arguments):
        training_run, model, args = initialize_module(
            arguments, model_constructor)
        optimizer = optimizer_constructor(model, args)
        scheduler = scheduler_constructor(optimizer, args)

        train(
            script_name=script_name,
            log_file_path=training_run.log_file_path,
            run_id=training_run.id,
            args=args,
            model=model,
            load_data=load_data,
            transform=transform,
            criterion=criterion,
            optimizer=optimizer,
            scheduler=scheduler)

    return main
