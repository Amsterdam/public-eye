from eelib.networks.Transformer.datasets.dataset_utils import (
    img_equal_split,
    img_equal_unsplit
)
import torch
import math
import torchvision.transforms as standard_transforms
import eelib.networks.Transformer.datasets.transforms as own_transforms
from PIL import Image
from easydict import EasyDict
import numpy as np
import h5py
from eelib.ml_density.dataset import listDataset as Dataset2
from eelib.ml_density.train_config import TrainConfig
from eelib.ml_density.utils import (
    get_gts_and_frames_in_dataset
)


def filter_data(data_list, crop_size):
    def big_enough(img_path):
        img = Image.open(img_path).convert('RGB')
        img_w, img_h = img.size
        return img_w > crop_size and img_h > crop_size

    filtered = [
        (img_path, den_path) for img_path, den_path
        in data_list if big_enough(img_path)
    ]
    return filtered


class Config(TrainConfig):

    def __init__(self, model, args):
        super().__init__()
        self._init_data(args)
        self._criterion = torch.nn.MSELoss(reduction='mean').cuda()
        self._optim = torch.optim.Adam(
            model.parameters(),
            lr=args['lr'],
            weight_decay=args['decay']
        )
        self._scheduler = torch.optim.lr_scheduler.StepLR(
            self._optim, step_size=1, gamma=math.sqrt(0.1))
        self._init_dataloaders(args, model.crop_size)

    def _init_data(self, args):
        self._data = EasyDict()
        self._data.LABEL_FACTOR = args["label_factor"]
        self._data.OVERLAP = args["overlap"]
        self._data.IGNORE_BUFFER = args["ignore_buffer"]
        self._data.BATCH_SIZE = args["batch_size"]

        # argument processing currently has no proper way of processing
        # tuple of arrays therefore has to be hardcoded here
        self._data.MEAN_STD = ([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])

    def _init_dataloaders(self, args, crop_size):
        unfiltered_train_list = get_gts_and_frames_in_dataset(
            args['train_dataset_id'])
        unfiltered_val_list = get_gts_and_frames_in_dataset(
            args['val_dataset_id'])
        train_list = filter_data(unfiltered_train_list, crop_size)
        val_list = filter_data(unfiltered_val_list, crop_size)

        self._print_filtered_number(
            len(unfiltered_train_list),
            len(unfiltered_train_list) - len(train_list),
            'train',
            crop_size
        )
        self._print_filtered_number(
            len(unfiltered_val_list),
            len(unfiltered_val_list) - len(val_list),
            'validation',
            crop_size
        )
        self._train_loader = torch.utils.data.DataLoader(
            Dataset2(
                train_list,
                self._get_load_data(crop_size)
            ),
            num_workers=args['workers'],
            batch_size=args['batch_size'],
        )
        self._val_loader = torch.utils.data.DataLoader(
            Dataset2(
                val_list,
                self._get_load_data_val(crop_size)
            ),
            num_workers=args['workers'],
            batch_size=1
        )

    def _get_load_data_val(self, crop_size):
        img_transform = standard_transforms.Compose([
            standard_transforms.ToTensor(),
            standard_transforms.Normalize(
                *self._data.MEAN_STD
            )
        ])
        gt_transform = standard_transforms.Compose([
            own_transforms.LabelScale(self._data.LABEL_FACTOR)
        ])

        def load_data_val(img_gt_path, train, enhance):
            img_path, gt_path = img_gt_path
            img = Image.open(img_path).convert('RGB')
            gt_file = h5py.File(gt_path, mode='r')
            target = Image.fromarray(np.asarray(gt_file['density']))

            img = img_transform(img)
            target = gt_transform(target)

            img_stack = img_equal_split(
                img,
                crop_size,
                self._data.OVERLAP)
            gts_stack = img_equal_split(
                target.unsqueeze(0),
                crop_size,
                self._data.OVERLAP)

            return img, img_stack, gts_stack

        return load_data_val

    def _get_load_data(self, crop_size):
        train_cropper = own_transforms.Compose([
                own_transforms.RandomTensorCrop([
                    crop_size,
                    crop_size
                ])
            ])
        train_main_transform = own_transforms.Compose([
            own_transforms.RandomCrop([
                crop_size,
                crop_size
            ]),
            own_transforms.RandomHorizontallyFlip()
        ])
        train_img_transform = standard_transforms.Compose([
            standard_transforms.ToTensor(),
            standard_transforms.Normalize(*self._data.MEAN_STD)
        ])
        gt_transform = standard_transforms.Compose([
            own_transforms.LabelScale(self._data.LABEL_FACTOR)
        ])

        def load_data(img_gt_path, train, enhance):
            img_path, gt_path = img_gt_path
            img = Image.open(img_path).convert('RGB')
            gt_file = h5py.File(gt_path, mode='r')
            target = Image.fromarray(np.asarray(gt_file['density']))

            img, target = train_main_transform(img, target)
            img = train_img_transform(img)
            target = gt_transform(target)

            img_crop, den_crop = train_cropper(img, target.unsqueeze(0))
            return img_crop, den_crop

        return load_data

    def _print_filtered_number(
        self,
        original_number,
        filtered_number,
        data_name,
        crop_size
    ):
        print(f"Original {data_name} list contains {original_number} images")
        print(f"{filtered_number} where removed because the width or height"
              + f" is smaller than the crop size: '{crop_size}'")

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
        (img, img_stack, gt_stack) = data
        img_stack = img_stack.squeeze(0).cuda()
        gt_stack = gt_stack.squeeze(0)  # Remove batch dim
        img = img.squeeze(0)  # Remove batch dim

        _, img_h, img_w = img.shape

        pred_den = model(img_stack)
        loss = self._criterion(pred_den, gt_stack.cuda())
        losses['loss'].append(loss.cpu().item())
        pred_den = pred_den.cpu()

        gt = img_equal_unsplit(
            gt_stack,
            self._data.OVERLAP,
            self._data.IGNORE_BUFFER,
            img_h,
            img_w,
            1
        )
        den = img_equal_unsplit(
            pred_den,
            self._data.OVERLAP,
            self._data.IGNORE_BUFFER,
            img_h,
            img_w,
            1
        )
        den = den.squeeze(0)  # Remove channel dim

        pred_cnt = den.sum() / self._data.LABEL_FACTOR
        gt_cnt = gt.sum() / self._data.LABEL_FACTOR

        losses['AEs'].append(torch.abs(pred_cnt - gt_cnt).item())
        losses['SEs'].append(torch.square(pred_cnt - gt_cnt).item())
        return losses

    def train_compute_step(self, model, losses, data):
        img_stack, gt_stack = data
        img_stack = img_stack.cuda()
        gt_stack = gt_stack.cuda()

        self.optim.zero_grad()
        out_den = model(img_stack)
        loss = self.criterion(out_den, gt_stack)
        loss.backward()
        self.optim.step()

        losses['loss'].append(loss.cpu().item())
        errors = (
            torch.sum(out_den - gt_stack, dim=(-2, -1))
            / self._data.LABEL_FACTOR
        )  # pred count - gt count

        # instead of torch.flatten, original code from Lando only had .tolist()
        # this didn't seem to work
        losses['APEs'] += torch.flatten(torch.abs(errors)).tolist()
        losses['SPEs'] += torch.flatten(torch.square(errors)).tolist()
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
            # Mean Absolute Error
            'MAPE': np.mean(losses['APEs']),
            # (root) Mean Squared Error
            'MSPE': np.sqrt(np.mean(losses['SPEs'])),
            'loss': np.mean(losses['loss'])
        }
