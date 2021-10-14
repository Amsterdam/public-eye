import os
import time
import torch
import json
import math
import signal
import uuid
import eelib.store as store
from collections import defaultdict
from eelib.ml_density.train_config import TrainConfig
from eelib.websocket import send_websocket_message


abort_run = False


def signal_handler(sig, frame):
    global abort_run
    abort_run = True


class Trainer:
    def __init__(
        self,
        model,
        args,
        config: TrainConfig,
        nn_name,
        run_id,
        log_file_path
    ):
        self.epoch = 1
        self.model = model
        self.cfg = config
        self.args = args
        self.run_id = run_id
        self.log_file_path = log_file_path

        self.best_loss = 10 ** 10  # just something high
        self.best_losses = []
        self.best_epoch = -1
        self.initialize_training_run(
            nn_name,
            run_id
        )

    def initialize_training_run(
        self,
        nn_name,
        run_id,
    ):
        neural_network = store.get_neural_network_by_name(nn_name)
        self.model_filename = self.save_state()
        config_path = (
            os.environ['EAGLE_EYE_PATH']
            + '/files/configs/{}.json'.format(uuid.uuid4()))

        with open(config_path, 'w') as f:
            json.dump(self.args, f)

        config_id = store.insert_train_config(config_path)
        model_id = store.insert_model(
            self.args["model_name"],
            neural_network.id,
            self.model_filename)

        store.update_train_run(
            run_id,
            model_id,
            config_id
        )
        updated_training_run = store.get_train_run_by_id_as_dict(run_id)
        updated_training_run["date"] = updated_training_run["date"].isoformat()
        send_websocket_message('training-run', 'update', updated_training_run)
        self.job_id = updated_training_run['job_id']

        # if program is interupted save the current model
        signal.signal(signal.SIGINT, signal_handler)

    def train(self):
        losses = self.evaluate_model()
        self.best_loss = losses[self.cfg.defining_loss]
        self.best_losses = losses
        self.print_losses(losses, 'Initial evaluation scores: ')
        self._init_log_file(losses)
        self._write_away_losses(losses)

        while self.epoch < self.args['epochs']:
            if abort_run:
                print('Canceling the train run')
                break

            epoch_start_time = time.time()
            losses = self.run_epoch()
            epoch_time = time.time() - epoch_start_time
            self.print_losses(
                losses, 'Train scores: ', time=epoch_time)

            if self.epoch % self.args['eval_every'] == 0 and not abort_run:
                eval_start_time = time.time()
                losses = self.evaluate_model()
                eval_time = time.time() - eval_start_time
                self._write_away_losses(losses)

                if losses[self.cfg.defining_loss] < self.best_loss:
                    self.best_loss = losses[self.cfg.defining_loss]
                    self.best_losses = losses
                    self.best_epoch = self.epoch
                    print_fancy_new_best_loss(self.cfg.defining_loss)
                    self.save_state(self.model_filename)

                losses[f'best {self.cfg.defining_loss}'] = self.best_loss
                self.print_losses(
                    losses, 'Evaluation scores: ', time=eval_time)

            if 'steps' in self.args and self.epoch in self.args['steps']:
                self.cfg.scheduler.step()
                lr = self.cfg.scheduler.get_last_lr()[0]
                print(f'Learning rate adjusted to {lr} at epoch {self.epoch}.')

            self.epoch += 1

        self._save_losses(self.best_losses)

    def _save_losses(self, losses=None):
        if not losses:
            losses = self.evaluate_model()

        for loss_name, loss_value in losses.items():
            if not math.isnan(loss_value):
                store.insert_score(
                    loss_name,
                    loss_value,
                    self.run_id
                )

    def _init_log_file(self, losses):
        with open(self.log_file_path, 'w') as log_file:
            head = ','.join(losses.keys())
            log_file.write(head)

    def _write_away_losses(self, losses):
        with open(self.log_file_path, 'a') as log_file:
            row = '\n' + ','.join([
                str(loss) for loss
                in losses.values()
            ])
            log_file.write(row)

        websocket_data = {
            "row": losses,
            "job_id": self.job_id
        }
        send_websocket_message('chart-data', 'update', websocket_data)

    def print_losses(self, losses, prefix='', time=None):
        to_display = prefix + ', '.join([
            f'{loss_name} {loss_value:.3f}'
            for loss_name, loss_value in losses.items()
        ])
        if time:
            to_display += f' [time elapsed : {time:.3f}s]'
        print(to_display)

    def run_epoch(self):
        self.model.train()
        train_losses = defaultdict(list)
        for idx, data in enumerate(self.cfg.train_loader):
            if abort_run:
                print('Canceling the epoch')
                break

            batch_start_time = time.time()
            self.cfg.train_compute_step(self.model, train_losses, data)
            batch_time = time.time() - batch_start_time
            if idx % self.args['print_freq'] == 0:
                print('Epoch: [{0}][{1}/{2}]\t'
                      'Time ({batch_time:.3f})\t'
                      .format(
                        self.epoch,
                        idx,
                        len(self.cfg.train_loader),
                        batch_time=batch_time))

            torch.cuda.empty_cache()

        return self.cfg.aggregate_train_losses(train_losses)

    def evaluate_model(self):
        """ Evaluate the model on the evaluation dataloader. """
        losses = defaultdict(list)
        self.model.eval()
        with torch.no_grad():
            for idx, data in enumerate(self.cfg.val_loader):
                if abort_run:
                    print('Canceling the epoch')
                    break
                losses = self.cfg.evaluation_compute_losses(
                    self.model, losses, data)

        return self.cfg.aggregate_eval_losses(losses)

    def save_state(self, filename=None):
        """
        Saves the variables needed to continue training later.
        """
        filename = (
            filename
            or (
                os.environ['EAGLE_EYE_PATH']
                + '/files/models/{}.pth.tar'.format(uuid.uuid4())
            )
        )
        save_sate = {
            'epoch': self.epoch,
            'best_epoch': self.best_epoch,
            f'best_{self.cfg.defining_loss}': self.best_loss,
            'state_dict': self.model.state_dict(),
            'optim': self.cfg.optim.state_dict(),
            'scheduler': self.cfg.scheduler.state_dict(),
        }

        print('Saving model...')

        torch.save(save_sate, filename)
        return filename

    def load_state(self, state_path):
        """ Loads the variables to continue training. """

        resume_state = torch.load(state_path)
        self.epoch = resume_state['epoch']
        self.best_epoch = resume_state['best_epoch']
        self.best_loss = resume_state[f'best_{self.cfg.defining_loss}']

        self.model.load_state_dict(resume_state['net'])
        self.cfg.optim.load_state_dict(resume_state['optim'])
        self.cfg.scheduler.load_state_dict(resume_state['scheduler'])


def print_fancy_new_best_loss(loss):
    """ For that extra bit of dopamine rush when you get a new high-score. """

    new_best = (
        '#'
        + ('=' * 15)
        + ('<' * 3)
        + ' NEW BEST '
        + loss
        + (' >' * 3)
        + ('=' * 15)
        + '#'
    )
    n_chars = len(new_best)
    bar = '#' + '=' * (n_chars - 2) + '#'
    print(bar)
    print(new_best)
    print(bar)
