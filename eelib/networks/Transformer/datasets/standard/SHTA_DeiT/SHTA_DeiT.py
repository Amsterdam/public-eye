import os

import numpy as np
import pandas as pd

import torch
from torch.utils import data

from PIL import Image
from .settings import cfg_data
from datasets.dataset_utils import img_equal_split, img_equal_unsplit


class SHTA_DeiT(data.Dataset):
    def __init__(self, data_path, mode, crop_size,
                 main_transform=None, img_transform=None, gt_transform=None, cropper=None):
        self.data_path = os.path.join(data_path, mode)
        self.crop_size = crop_size
        self.mode = mode  # train or test

        self.img_transform = img_transform
        self.gt_transform = gt_transform
        self.main_transform = main_transform
        self.cropper = cropper

        self.img_extension = '.jpg'

        self.data_files = [os.path.join(self.data_path, 'img', file)
                           for file in os.listdir(os.path.join(self.data_path, 'img'))
                           if file.endswith(self.img_extension)]

        self.num_samples = len(self.data_files)

        print(f'{len(self.data_files)} {self.mode} images found.')

    def __getitem__(self, index):
        img_path = self.data_files[index]
        img, den = self.read_image_and_gt(img_path)

        if self.main_transform is not None:
            img, den = self.main_transform(img, den)
        if self.img_transform is not None:
            img = self.img_transform(img)
        if self.gt_transform is not None:
            den = self.gt_transform(den)

        if self.mode == 'train':
            img, den = self.cropper(img, den.unsqueeze(0))
            return img, den
        else:
            img_stack = img_equal_split(img, self.crop_size, cfg_data.OVERLAP)
            gts_stack = img_equal_split(den.unsqueeze(0), self.crop_size, cfg_data.OVERLAP)
            return img, img_stack, gts_stack

    def read_image_and_gt(self, img_path):
        den_path = img_path.replace('img', 'den').replace(self.img_extension, '.csv')

        img = Image.open(img_path)
        if img.mode == 'L':
            img = img.convert('RGB')

        den = pd.read_csv(den_path, header=None).values
        den = den.astype(np.float32, copy=False)
        den = Image.fromarray(den)

        return img, den

    def __len__(self):
        return self.num_samples
