import os
import time
import numpy as np
import torch
from torch.utils.tensorboard import SummaryWriter
from collections import OrderedDict

from datasets.dataset_utils import img_equal_unsplit
import matplotlib.pyplot as plt
from matplotlib import cm as CM


class Trainer:
    def __init__(self, meta_wrapper, loading_data, cfg, cfg_data):
        """
        The Trainer is the class that facilitates the meta training of a model. After initialising, call 'train' to
        train the model. Based on the trainer of the C^3 Framework: https://github.com/gjy3035/C-3-Framework
        :param meta_wrapper: Wrapper to the base model and functional model.
        :param loading_data: a function with which the train/val/test dataloaders can be retrieved, as well as the
                             transform that transforms normalised images back to the original.
        :param cfg: The configurations for this run.
        :param cfg_data: The configurations specific to the dataset and dataloaders.
        """

        self.meta_wrapper = meta_wrapper

        self.cfg = cfg
        self.cfg_data = cfg_data

        self.train_loader, self.val_loaders, self.test_loaders, self.restore_transform = loading_data()
        self.train_samples = len(self.train_loader.dataset)
        # self.eval_save_example_every = self.test_samples // self.cfg.SAVE_NUM_EVAL_EXAMPLES

        self.beta = self.cfg.BETA
        self.meta_optimiser = torch.optim.Adam(self.meta_wrapper.get_params(),
                                               lr=self.beta, weight_decay=cfg.WEIGHT_DECAY)
        self.scheduler = torch.optim.lr_scheduler.StepLR(self.meta_optimiser, step_size=1, gamma=cfg.LR_GAMMA)

        self.n_tasks = cfg.N_TASKS

        self.epoch = 0
        self.best_mae = 10 ** 10  # just something high
        self.best_epoch = -1

        self.writer = SummaryWriter(cfg.SAVE_DIR)

        if self.cfg.MAML or self.epoch < self.cfg.ALPHA_START:
            self.meta_wrapper.disable_alpha_updates()

        # if cfg.RESUME:
        #     self.load_state(cfg.RESUME_PATH)
        #     print(f'Resuming from epoch {self.epoch}')
        # else:
        #     self.save_eval_pics()
        #     self.writer.add_scalar('lr', self.scheduler.get_last_lr()[0], self.epoch)

    def meta_loop_inner(self, train_data, test_data, theta):
        """ The inner part of the meta-learning loop (each task in 'for all T_i do') . """

        theta_values = [theta[k] for k in theta if not k.startswith('alpha.')]
        theta_names = [k for k in theta if not k.startswith('alpha.')]
        alpha_values = [theta[k] for k in theta if k.startswith('alpha.')]

        # Before
        train_loss, train_pred, train_error = self.meta_wrapper.train_forward(train_data, theta)
        grads = torch.autograd.grad(train_loss, theta_values)

        # Adapt
        theta_prime = OrderedDict((n, w - a * g) for n, w, a, g in zip(theta_names, theta_values, alpha_values, grads))

        # After
        test_loss, test_pred, test_error = self.meta_wrapper.train_forward(test_data, theta_prime)

        # Info for logging
        before_error = train_error / (self.cfg_data.LABEL_FACTOR * self.cfg_data.K_TRAIN)
        after_error = test_error / (self.cfg_data.LABEL_FACTOR * self.cfg_data.K_META)
        avg_AE_improvement = before_error - after_error

        return test_loss, avg_AE_improvement

    def meta_loop_outer(self, task_batch, theta):
        """ The outer part of the meta-learning loop (For all T_i). """

        AEs = []
        total_metaloss = torch.tensor(0).float().cuda()

        self.meta_optimiser.zero_grad()  # Prob not needed since we set the gradients manually
        for train_data, test_data in task_batch:  # For each task
            test_loss, avg_AE_improvement = self.meta_loop_inner(train_data, test_data, theta)
            total_metaloss += test_loss
            AEs.append(avg_AE_improvement.item())

        avg_metaloss = total_metaloss / self.n_tasks
        mean_improvement = np.mean(AEs)
        return avg_metaloss, mean_improvement

    def run_epoch(self):
        """ Runs one pass over all training scenes. Note that this not necessarily contains all training images. """

        tasks_sampler = iter(self.train_loader)  # So we can manually go over the dataset.
        scenes_left = len(self.train_loader.dataset)  # Number of scenes

        n_improvements = 0  # Number of scenes on which performance improved after adaptation
        n_non_imrovements = 0  # Number of scenes on which performance did not improved after adaptation.
        mean_improvements = []  # Mean improvement after adaptation on a scene.

        self.meta_wrapper.train()
        while scenes_left >= self.n_tasks:
            # Make a batch of tasks
            task_batch = []
            for _ in range(self.n_tasks):
                train_imgs, train_gts, test_imgs, test_gts = next(tasks_sampler)
                train_imgs = train_imgs.squeeze(0)
                train_gts = train_gts.squeeze(0)  # Technically not needed due to .squeeze later
                test_imgs = test_imgs.squeeze(0)
                test_gts = test_gts.squeeze(0)  # But these are the dimensions they are supposed to be
                task_batch.append(((train_imgs, train_gts), (test_imgs, test_gts)))
            scenes_left -= self.n_tasks

            # Get model weights (theta)
            theta = self.meta_wrapper.get_theta()
            trainable_weights = [v for k, v in theta.items() if v.requires_grad]

            # Loop over batches
            avg_metaloss, mean_improvement = self.meta_loop_outer(task_batch, theta)

            # Update theta
            metagrads = torch.autograd.grad(avg_metaloss, trainable_weights)
            for w, g in zip(trainable_weights, metagrads):
                w.grad = g
            self.meta_optimiser.step()

            # Logging
            mean_improvements.append(mean_improvement)

            n_improvements += 1 if mean_improvement > 0 else 0
            n_non_imrovements += 1 if mean_improvement < 0 else 0

        return mean_improvements, n_improvements, n_non_imrovements

    def train(self):
        """ Trains the model with meta training. """
        self.evaluate_model()

        # Log alpha stats
        self.log_alpha()

        self.meta_wrapper.train()
        while self.epoch < self.cfg.MAX_EPOCH:  # While not done
            self.epoch += 1

            if self.epoch == self.cfg.ALPHA_START:
                self.meta_wrapper.enable_alpha_updates()

            mean_improvements, n_improvements, n_non_imrovements = self.run_epoch()

            if self.epoch % self.cfg.EVAL_EVERY == 0:
                self.evaluate_model()

            # Logging
            self.log_alpha()

            percent_improved = n_improvements / (n_improvements + n_non_imrovements) * 100  # Above 50% is good
            self.writer.add_scalar('Train/mean_improvement', np.mean(mean_improvements), self.epoch)
            self.writer.add_scalar('Train/n_improvements', n_improvements, self.epoch)
            self.writer.add_scalar('Train/n_non_imrovements', n_non_imrovements, self.epoch)
            self.writer.add_scalar('Train/percent_improved', percent_improved, self.epoch)

            print(f'ep {self.epoch} mean test improvement: {np.mean(mean_improvements):.3f}. '
                  f'{percent_improved:.1f}% improved. {n_improvements} improved, {n_non_imrovements} not improved.')

            if self.epoch % self.cfg.SAVE_EVERY == 0:
                self.save_state()
        self.save_state()

    def evaluate_model(self):
        scene_improvements = 0
        scene_non_improvements = 0
        _overal_loss_improvement = []
        _overal_MAE_before = []
        _overal_MAE_after = []
        _overal_MAE_improvement = []
        _overal_MSE_improvement = []

        for val_loader in self.val_loaders:
            # ========================================================================================= #
            #                                          BEFORE                                           #
            # ========================================================================================= #
            self.meta_wrapper.eval()
            MLoss_before, MAE_before, MSE_before = self.eval_on_scene(val_loader, weight_dict=None)

            # ========================================================================================= #
            #                                        ADAPTATION                                         #
            # ========================================================================================= #
            self.meta_wrapper.train()
            adapt_data = val_loader.dataset.get_adapt_batch()

            theta = self.meta_wrapper.get_theta()
            theta_values = list(theta[k] for k in theta if not k.startswith('alpha.'))
            theta_names = list(k for k in theta if not k.startswith('alpha.'))
            alpha_values = list(theta[k] for k in theta if k.startswith('alpha.'))

            train_loss, train_pred, train_error = self.meta_wrapper.train_forward(adapt_data, theta)
            grads = torch.autograd.grad(train_loss, theta_values)

            theta_prime = OrderedDict(
                (n, w - a * g) for n, w, a, g in zip(theta_names, theta_values, alpha_values, grads)
            )

            # ========================================================================================= #
            #                                           AFTER                                           #
            # ========================================================================================= #
            self.meta_wrapper.eval()
            MLoss_after, MAE_after, MSE_after = self.eval_on_scene(val_loader, theta_prime)

            # ========================================================================================= #
            #                                          LOGGING                                          #
            # ========================================================================================= #
            loss_improvement = MLoss_before - MLoss_after
            MAE_improvement = MAE_before - MAE_after
            MSE_improvement = MSE_before - MSE_after

            _overal_MAE_before.append(MAE_before)
            _overal_MAE_after.append(MAE_after)
            _overal_loss_improvement.append(loss_improvement)
            _overal_MAE_improvement.append(MAE_improvement)
            _overal_MSE_improvement.append(MSE_improvement)

            scene_improvements += 1 if MAE_improvement > 0 else 0
            scene_non_improvements += 1 if MAE_improvement <= 0 else 0

            scene_id = val_loader.dataset.scene_id
            self.writer.add_scalar(f'eval/{scene_id}/loss_improvement', loss_improvement, self.epoch)
            self.writer.add_scalar(f'eval/{scene_id}/MAE_before', MAE_before, self.epoch)
            self.writer.add_scalar(f'eval/{scene_id}/MAE_after', MAE_after, self.epoch)
            self.writer.add_scalar(f'eval/{scene_id}/MAE_improvement', MAE_improvement, self.epoch)
            self.writer.add_scalar(f'eval/{scene_id}/MSE_improvement', MSE_improvement, self.epoch)

        overal_MAE_before = np.mean(_overal_MAE_before)
        overal_MAE_after = np.mean(_overal_MAE_after)
        overal_loss_improvement = np.mean(_overal_loss_improvement)
        overal_MAE_improvement = np.mean(_overal_MAE_improvement)
        overal_MSE_improvement = np.mean(_overal_MSE_improvement)

        self.writer.add_scalar(f'eval/overal_loss_improvement', overal_loss_improvement, self.epoch)
        self.writer.add_scalar(f'eval/overal_MAE_before', overal_MAE_before, self.epoch)
        self.writer.add_scalar(f'eval/overal_MAE_after', overal_MAE_after, self.epoch)
        self.writer.add_scalar(f'eval/overal_MAE_improvement', overal_MAE_improvement, self.epoch)
        self.writer.add_scalar(f'eval/overal_MSE_improvement', overal_MSE_improvement, self.epoch)

        return

    def eval_on_scene(self, scene_loader, weight_dict=None):
        """ Evaluate the model on a specific scene. """
        _MAE = []
        _MSE = []
        _Mloss = []

        for eval_data in scene_loader:
            with torch.no_grad():
                img, pred, gt, loss, test_AE, test_SE = self.meta_wrapper.test_forward(eval_data, weight_dict)
            _Mloss.append(loss.item())
            _MAE.append(test_AE.item() / self.cfg_data.LABEL_FACTOR)
            _MSE.append(test_SE.item() / self.cfg_data.LABEL_FACTOR)

        MLoss = np.mean(_Mloss)
        MAE = np.mean(_MAE)
        MSE = np.mean(_MSE)

        return MLoss, MAE, MSE

    def log_alpha(self):
        """ Each model parameter has an alpha with equal dimensions. This function logs the mean and std. dev. of each
        such alpha.
        Note: These are still logged when using MAML, though they will all be flat lines."""

        for alpha_name, alpha_value in self.meta_wrapper.base_model.alpha.items():
            alpha_mean = torch.mean(alpha_value).item()
            alpha_std = torch.std(alpha_value).item()

            self.writer.add_scalar(f'Alpha_stats_means/{alpha_name}', alpha_mean, self.epoch)
            self.writer.add_scalar(f'Alpha_stats_stds/{alpha_name}', alpha_std, self.epoch)

    def save_state(self, name_extra=''):
        """ Saves the variables needed to continue training later. """

        if name_extra:
            save_name = f'{self.cfg.STATE_DICTS_DIR}/save_state_ep_{self.epoch}_{name_extra}.pth'
        else:
            save_name = f'{self.cfg.STATE_DICTS_DIR}/save_state_ep_{self.epoch}.pth'

        save_sate = {
            'epoch': self.epoch,
            'best_epoch': self.best_epoch,
            'best_mae': self.best_mae,
            'net': self.meta_wrapper.base_model.state_dict(),
            'optim': self.meta_optimiser.state_dict(),
            'scheduler': self.scheduler.state_dict(),
            'save_dir_path': self.cfg.SAVE_DIR,
        }

        torch.save(save_sate, save_name)

    # def load_state(self, state_path):
    #     """ Loads the variables to continue training. """
    #
    #     resume_state = torch.load(state_path)
    #     self.epoch = resume_state['epoch']
    #     self.best_epoch = resume_state['best_epoch']
    #     self.best_mae = resume_state['best_mae']
    #
    #     self.model.load_state_dict(resume_state['net'])
    #     self.meta_optimiser.load_state_dict(resume_state['optim'])
    #     self.scheduler.load_state_dict(resume_state['scheduler'])


def print_fancy_new_best_MAE():
    """ For that extra bit of dopamine rush when you get a new high-score"""

    new_best = '#' + '=' * 20 + '<' * 3 + ' NEW BEST MAE ' + '>' * 3 + '=' * 20 + '#'
    n_chars = len(new_best)
    bar = '#' + '=' * (n_chars - 2) + '#'
    print(bar)
    print(new_best)
    print(bar)
