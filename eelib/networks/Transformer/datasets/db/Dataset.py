import os

import numpy as np
import pandas as pd
import h5py
import torch
import cv2
from torch.utils import data

from PIL import Image
# from eelib.ml_transformer.datasets.standard.Multiset_DeiT.settings import cfg_data
from eelib.ml_transformer.datasets.dataset_utils import img_equal_split


class Dataset(data.Dataset):
    def __init__(
        self,
        data_paths,
        mode,
        crop_size,
        cfg_data,
        main_transform=None,
        img_transform=None,
        gt_transform=None,
        cropper=None
    ):
        self.crop_size = crop_size
        self.mode = mode  # train or test
        self.cfg_data = cfg_data
        self.main_transform = main_transform
        self.img_transform = img_transform
        self.gt_transform = gt_transform
        self.cropper = cropper

        self.data_files = data_paths

        if not self.data_files:  # If we only have a train or test set, we can still initialize the dataloader.
            self.data_files = ['Dummy']  # Handy for testing on a separate test set that doesn't have a train set.
        self.num_samples = len(self.data_files)

        if self.data_files[0] == 'Dummy':
            print(f'No {self.mode} images found in {len(data_paths)} datasets.')
        else:
            print(f'{len(self.data_files)} {self.mode} images found in {len(data_paths)} datasets.')

    def __getitem__(self, index):
        img, den = self.read_image_and_gt(index)

        # if self.data_files[index][0] == '/home/joeri/eagle_eye/files/public_datasets/ShanghaiTech_Crowd_Counting_Dataset/part_A_final/test_data/images/IMG_6.jpg':
        #     return None, None
        # print('fileeee', self.data_files[index])
        if self.main_transform is not None:
            img, den = self.main_transform(img, den)
        if self.img_transform is not None:
            img = self.img_transform(img)
        if self.gt_transform is not None:
            den = self.gt_transform(den)

        if self.mode == 'train':
            img_crop, den_crop = self.cropper(img, den.unsqueeze(0))
            return img_crop, den_crop
        else:
            img_stack = img_equal_split(
                img, self.crop_size, self.cfg_data.OVERLAP)
            gts_stack = img_equal_split(
                den.unsqueeze(0), self.crop_size, self.cfg_data.OVERLAP)
            return img, img_stack, gts_stack

# img_path, gt_path = img_gt_path
#     img = Image.open(img_path).convert('RGB')
#     gt_file = h5py.File(gt_path, mode='r')
#     target = np.asarray(gt_file['density'])
    def read_image_and_gt(self, index):
        img_path, gt_path = self.data_files[index]
        img = Image.open(img_path).convert('RGB')
        gt_file = h5py.File(gt_path, mode='r')
        target = np.asarray(gt_file['density'])

        return img, Image.fromarray(target)
        # img = Image.open(img_path).convert('RGB')
        # # if img.mode == 'L':  # Black and white
        # #     img = img.convert('RGB')  # Colour

        # gt_file = h5py.File(den_path, mode='r')
        # den = np.asarray(gt_file['density'])
        # # den = cv2.resize(
        # #     den,
        # #     (den.shape[1]//8, den.shape[0]//8),
        # #     interpolation=cv2.INTER_CUBIC
        # # )*64


        # print('why?', np.array(img).shape, den.shape)
        # return img, den

    def __len__(self):
        return self.num_samples
