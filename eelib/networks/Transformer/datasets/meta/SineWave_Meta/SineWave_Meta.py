import os
import random

import numpy as np
import pandas as pd

import torch
from torch.utils import data

from PIL import Image
from .settings import cfg_data
from datasets.dataset_utils import img_equal_split


class SineTask():
    """ Code from https://github.com/infinitemugen/MAML-Pytorch"""
    def __init__(self, amp, phase, min_x, max_x):
        self.phase = phase
        self.max_x = max_x
        self.min_x = min_x
        self.amp = amp

    def sample_data(self, size=1):
        x = np.random.uniform(self.max_x, self.min_x, size)
        y = self.true_sine(x)
        x = torch.tensor(x, dtype=torch.float).unsqueeze(1)
        y = torch.tensor(y, dtype=torch.float).unsqueeze(1)
        return x, y

    def true_sine(self, x):
        y = self.amp * np.sin(self.phase + x)
        return y


class SineDistribution():
    """ Code from https://github.com/infinitemugen/MAML-Pytorch """
    def __init__(self, min_amp, max_amp, min_phase, max_phase, min_x, max_x):
        self.min_amp = min_amp
        self.max_phase = max_phase
        self.min_phase = min_phase
        self.max_amp = max_amp
        self.min_x = min_x
        self.max_x = max_x

    def sample_task(self):
        amp = np.random.uniform(self.min_amp, self.max_amp)
        phase = np.random.uniform(self.min_phase, self.max_phase)
        return SineTask(amp, phase, self.min_x, self.max_x)


class SineWave_Meta(data.Dataset):
    def __init__(self):
        self.num_samples = 100  # Since our code expects 'scenes', we provide some arbitrary number.
        self.task_generator = SineDistribution(0.1, 5, 0, np.pi, -5, 5)

    def __getitem__(self, index):
        task = self.task_generator.sample_task()

        x_train, y_train = task.sample_data(cfg_data.K_TRAIN)
        x_test, y_test = task.sample_data(cfg_data.K_META)

        return x_train, y_train, x_test, y_test

    def __len__(self):
        return self.num_samples


class SineWave_Meta_eval(data.Dataset):
    def __init__(self, identifier):
        self.scene_id = identifier  # We don't really have 'scenes'. Each 'scene' is a specific Sine Distribution

        self.task_generator = SineDistribution(0.1, 5, 0, np.pi, -5, 5)
        self.task = self.task_generator.sample_task()
        self.adapt_data = self.task.sample_data(cfg_data.K_TRAIN)

        self.data_points = []
        for _ in range(cfg_data.N_EVAL_POINTS):  # How many random data points to evaluate our model on
            x, y = self.task.sample_data(1)
            self.data_points.append((x, y))

        self.num_samples = len(self.data_points)

    def __getitem__(self, index):
        x, y = self.data_points[index]
        return x, y

    def get_adapt_batch(self):
        x, y = self.adapt_data
        return x, y

    def __len__(self):
        return self.num_samples
