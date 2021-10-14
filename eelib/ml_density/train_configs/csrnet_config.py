import torch
import random
import numpy as np
import math
import h5py
import cv2
from PIL import Image
from torch.autograd import Variable
from eelib.ml.standard_transform import standard_transform
from eelib.ml_density.utils import (
    get_gts_and_frames_in_dataset,
    resize
)
from eelib.ml_density.dataset import listDataset as Dataset
from eelib.ml_density.train_config import TrainConfig


class Config(TrainConfig):
    def __init__(
        self,
        model,
        args,
    ):
        super().__init__()
        self._criterion = torch.nn.MSELoss(size_average=False).cuda()
        self._optim = torch.optim.SGD(
            filter(lambda p: p.requires_grad, model.parameters()),
            args['lr'],
            momentum=args['momentum'],
            weight_decay=args['decay'])
        self._scheduler = torch.optim.lr_scheduler.StepLR(
            self._optim, step_size=1, gamma=math.sqrt(0.1))
        self._init_dataloaders(args)
        self._args = args

    def _init_dataloaders(self, args):
        train_list = get_gts_and_frames_in_dataset(
            args['train_dataset_id'])
        val_list = get_gts_and_frames_in_dataset(
            args['val_dataset_id'])

        print('num workers', args['workers'])
        self._train_loader = torch.utils.data.DataLoader(
            Dataset(
                train_list,
                self._get_load_data(),
                enhance=args['enhance'],
                train=True
            ),
            num_workers=args['workers'],
            batch_size=args['batch_size']
        )
        self._val_loader = torch.utils.data.DataLoader(
            Dataset(
                val_list,
                self._get_load_data(),
            ),
            num_workers=args['workers'],
            batch_size=args['batch_size'],
        )

    def _get_load_data(self):
        def load_data(img_gt_path, train, enhance):
            img_path, gt_path = img_gt_path
            img = Image.open(img_path).convert('RGB')
            gt_file = h5py.File(gt_path, mode='r')
            target = np.asarray(gt_file['density'])

            if enhance:
                rand_val = random.randint(0, 100)
                if rand_val > 10:
                    crop_size = (img.size[0]/2, img.size[1]/2)

                    if rand_val > 50:
                        dx = int(random.randint(0, 1) * img.size[0] * 1./2)
                        dy = int(random.randint(0, 1) * img.size[1] * 1./2)
                    else:
                        dx = int(random.random() * img.size[0] * 1./2)
                        dy = int(random.random() * img.size[1] * 1./2)

                    img = img.crop(
                        (dx, dy, crop_size[0] + dx, crop_size[1] + dy))
                    target = target[
                        dy:int(crop_size[1]) + dy,
                        dx:int(crop_size[0]) + dx]

                    rand_val = random.randint(0, 100)

                    if rand_val >= 50:
                        target = np.fliplr(target)
                        img = img.transpose(Image.FLIP_LEFT_RIGHT)

            target = cv2.resize(
                target,
                (target.shape[1] // 8, target.shape[0] // 8),
                interpolation=cv2.INTER_CUBIC)*64

            img = standard_transform(img)
            if self._args['scale_factor'] != 1.0:
                img, target = resize(img, target, self._args['scale_factor'])

            return img, target

        return load_data

    @property
    def criterion(self):
        return self._criterion

    @property
    def optim(self):
        return self._optim

    @property
    def train_loader(self):
        return self._train_loader

    @property
    def val_loader(self):
        return self._val_loader

    @property
    def data(self):
        return self._data

    @property
    def defining_loss(self):
        return 'mae'

    @property
    def scheduler(self):
        return self._scheduler

    def evaluation_compute_losses(self, model, losses, data):
        img, target = data
        img = img.cuda()
        img = Variable(img)
        output = model(img)

        target = target.type(torch.FloatTensor).unsqueeze(0).cuda()
        target = Variable(target)
        target = target.transpose(1, 0)

        loss = self._criterion(output, target)
        losses['AEs'].append(
            torch.abs(
                output.data.sum()
                - target.sum().type(torch.FloatTensor).cuda()
            ).item()
        )
        losses['SEs'].append(
            torch.square(
                output.data.sum()
                - target.sum().type(torch.FloatTensor).cuda()
            ).item()
        )
        losses['loss'].append(loss.item())

        return losses

    def train_compute_step(self, model, losses, data):
        img, target = data
        img = img.cuda()
        img = Variable(img)
        output = model(img)

        target = target.type(torch.FloatTensor).unsqueeze(0).cuda()
        target = Variable(target)
        target = target.transpose(1, 0)

        loss = self._criterion(output, target)
        losses['loss'].append(loss.item())

        self._optim.zero_grad()
        loss.backward()
        self._optim.step()

        return losses

    def aggregate_eval_losses(self, losses):
        return {
            # Mean Absolute Error
            'mae': np.mean(losses['AEs']),
            # (root) Mean Squared Error
            'mse': np.sqrt(np.mean(losses['SEs'])),
            'loss': np.mean(losses['loss'])
        }

    def aggregate_train_losses(self, losses):
        return {
            'loss': np.mean(losses['loss'])
        }
