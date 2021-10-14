import os
import random

import numpy as np
import pandas as pd

import torch
from torch.utils import data

from PIL import Image
from .settings import cfg_data
from datasets.dataset_utils import img_equal_split


class WE_DeiT_Meta(data.Dataset):
    def __init__(self, data_path, mode,
                 main_transform=None, img_transform=None, gt_transform=None, splitter=None):
        self.data_path = os.path.join(data_path, mode)
        self.mode = mode  # train or test

        self.main_transform = main_transform
        self.img_transform = img_transform
        self.gt_transform = gt_transform
        self.splitter = splitter

        self.scenes = os.listdir(self.data_path)
        self.data_files = {}

        for scene in self.scenes:
            scene_dir = os.path.join(self.data_path, scene, 'img')
            self.data_files[scene] = [os.path.join(scene_dir, img_name) for img_name in os.listdir(scene_dir)]

        self.num_samples = len(self.scenes)

        print(f'{self.num_samples} scenes found.')

    def __getitem__(self, index):
        scene = self.scenes[index]
        n_datapoints = cfg_data.K_TRAIN + cfg_data.K_META  # D + D'
        _imgs_stack = []
        _gts_stack = []
        flip = random.random() < 0.5  # whether or not to flip the scene

        data_files = random.sample(self.data_files[scene], n_datapoints)
        for file in data_files:
            img, den = self.read_image_and_gt(file)

            if self.main_transform is not None:  # Should be deterministic!
                img, den, _ = self.main_transform(img, den, flip)
            if self.img_transform is not None:
                img = self.img_transform(img)
            if self.gt_transform is not None:
                den = self.gt_transform(den)
            img_stack = img_equal_split(img, cfg_data.CROP_SIZE, cfg_data.OVERLAP)
            gts_stack = img_equal_split(den.unsqueeze(0), cfg_data.CROP_SIZE, cfg_data.OVERLAP)
            _imgs_stack.append(img_stack)
            _gts_stack.append(gts_stack)

        return torch.cat(_imgs_stack[0:cfg_data.K_TRAIN]), \
               torch.cat(_gts_stack[0:cfg_data.K_TRAIN]), \
               torch.cat(_imgs_stack[cfg_data.K_TRAIN:n_datapoints]), \
               torch.cat(_gts_stack[cfg_data.K_TRAIN:n_datapoints])  # Meow Meow

    def read_image_and_gt(self, img_path):
        den_path = img_path.replace('img', 'den').replace('.jpg', '.csv')

        img = Image.open(img_path)
        if img.mode == 'L':
            img = img.convert('RGB')

        den = pd.read_csv(den_path, header=None).values
        den = den.astype(np.float32, copy=False)
        den = Image.fromarray(den)

        return img, den

    def __len__(self):
        return self.num_samples


class WE_DeiT_Meta_eval(data.Dataset):
    def __init__(self, data_path, mode, scene, adapt_imgs=None, n_adapt_imgs=None,
                 main_transform=None, img_transform=None, gt_transform=None):

        assert adapt_imgs or n_adapt_imgs, "One of adapt_imgs or n_adapt_imgs must be set."
        assert not (adapt_imgs and n_adapt_imgs), "Only one of adapt_imgs and n_adapt_imgs must be set."

        self.data_path = os.path.join(data_path, mode, scene, 'img')
        self.mode = mode  # train or test
        self.scene_id = scene

        self.main_transform = main_transform
        self.img_transform = img_transform
        self.gt_transform = gt_transform

        self.data_files = [os.path.join(self.data_path, image) for image in os.listdir(self.data_path)]
        if adapt_imgs:
            self.adapt_imgs = [os.path.join(self.data_path, adapt_img) for adapt_img in adapt_imgs]
        else:
            self.adapt_imgs = random.sample(self.data_files, n_adapt_imgs)

        self.data_files = [img_path for img_path in self.data_files if img_path not in self.adapt_imgs]

        self.num_samples = len(self.data_files)

        print(f'{self.num_samples} images found.')

    def __getitem__(self, index):
        _img_stack = []
        _gts_stack = []

        img, den = self.read_image_and_gt(self.data_files[index])
        if self.main_transform is not None:
            img, den = self.main_transform(img, den)
        if self.img_transform is not None:
            img = self.img_transform(img)
        if self.gt_transform is not None:
            den = self.gt_transform(den)

        img_stack = img_equal_split(img, cfg_data.CROP_SIZE, cfg_data.OVERLAP)
        gts_stack = img_equal_split(den.unsqueeze(0), cfg_data.CROP_SIZE, cfg_data.OVERLAP)

        return img, img_stack, gts_stack

    def read_image_and_gt(self, img_path):
        den_path = img_path.replace('img', 'den').replace('.jpg', '.csv')

        img = Image.open(img_path)
        if img.mode == 'L':
            print('NON RGB IMAGE DETECTED')
            img = img.convert('RGB')

        den = pd.read_csv(den_path, header=None).values
        den = den.astype(np.float32, copy=False)
        den = Image.fromarray(den)

        return img, den

    def __len__(self):
        return self.num_samples

    def get_adapt_batch(self):
        _imgs_stack = []
        _gts_stack = []

        for img_path in self.adapt_imgs:
            img, den = self.read_image_and_gt(img_path)
            if self.img_transform is not None:
                img = self.img_transform(img)
            if self.gt_transform is not None:
                den = self.gt_transform(den)
            img_stack = img_equal_split(img, cfg_data.CROP_SIZE, cfg_data.OVERLAP)
            gts_stack = img_equal_split(den.unsqueeze(0), cfg_data.CROP_SIZE, cfg_data.OVERLAP)
            _imgs_stack.append(img_stack)
            _gts_stack.append(gts_stack)

        img_stack = torch.cat(_imgs_stack)
        gt_stack = torch.cat(_gts_stack)
        return img_stack, gt_stack
