import random
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as standard_transforms
from skimage import exposure, img_as_float, img_as_ubyte
from eelib.networks.Transformer.datasets.dataset_utils import generate_scaled_density
import math


class Compose(object):
    def __init__(self, transforms):
        self.transforms = transforms

    def __call__(self, img, mask, bbx=None):
        if bbx is None:
            for t in self.transforms:
                img, mask = t(img, mask)
            return img, mask
        for t in self.transforms:
            img, mask, bbx = t(img, mask, bbx)
        return img, mask, bbx


class PILToTensor(object):
    def __call__(self, img):
        return standard_transforms.ToTensor()(np.array(img))


class RandomHorizontallyFlip(object):
    def __call__(self, img, mask, bbx=None):
        if random.random() < 0.5:
            if bbx is None:
                return img.transpose(Image.FLIP_LEFT_RIGHT), mask.transpose(Image.FLIP_LEFT_RIGHT)
            w, h = img.size
            xmin = w - bbx[:, 3]
            xmax = w - bbx[:, 1]
            bbx[:, 1] = xmin
            bbx[:, 3] = xmax
            return img.transpose(Image.FLIP_LEFT_RIGHT), mask.transpose(Image.FLIP_LEFT_RIGHT), bbx
        if bbx is None:
            return img, mask
        return img, mask, bbx


class DeterministicHorizontallyFlip(object):
    def __call__(self, img, den, flip):  # I think I am hacking this bbox thing here :/
        if flip:
            return img.transpose(Image.FLIP_LEFT_RIGHT), den.transpose(Image.FLIP_LEFT_RIGHT), flip
        else:
            return img, den, flip


class RandomScale(object):
    def __call__(self, img, mat, den):
        if random.random() < 1.:
            w, h = img.size
            scale = random.uniform(0.5, 1.5)
            new_w = math.ceil(scale * w)
            new_h = math.ceil(scale * h)

            img = img.resize((new_w, new_h))

            den = generate_scaled_density(img, mat, 4, scale)
            den = den.astype(np.float32, copy=False)
            den = Image.fromarray(den)

        return img, den, None


class RandomCrop(object):
    def __init__(self, crop_shape):
        self.crop_w = crop_shape[0]
        self.crop_h = crop_shape[1]

    def __call__(self, img, den, bbx=None):
        assert img.size == den.size

        w, h = img.size

        # images can be smaller than the crop size
        x1 = random.randint(0, w - self.crop_w if w - self.crop_w > 0 else 0)
        y1 = random.randint(0, h - self.crop_h if h - self.crop_h > 0 else 0)

        crop_box = (x1, y1, x1 + self.crop_w, y1 + self.crop_h)
        return img.crop(crop_box), den.crop(crop_box)


class RandomTensorCrop(object):
    def __init__(self, crop_shape):
        self.crop_w = crop_shape[0]
        self.crop_h = crop_shape[1]

    def __call__(self, img, den, bbx1=None):
        assert img.shape[1:] == den.shape[1:]
        _, h, w = img.shape
        y1 = random.randint(0, h - self.crop_h)
        x1 = random.randint(0, w - self.crop_w)

        return img[:, y1:y1 + self.crop_h, x1:x1 + self.crop_w], den[:, y1:y1 + self.crop_h, x1:x1 + self.crop_w]


class RandomGrayscale(object):
    def __call__(self, img):
        if random.random() < 0.1:
            return img.convert('L').convert('RGB')
        else:
            return img


class RandomGammaTransform(object):
    def __call__(self, img):
        if random.random() < 0.25:
            gamma = random.uniform(0.5, 1.5)
            img = img_as_float(img)
            img = exposure.adjust_gamma(img, gamma)
            img = Image.fromarray(img_as_ubyte(img))
        return img


class FixedScaleFactor(object):
    def __init__(self, factor):
        self.factor = factor

    def __call__(self, img, den, bbx=None):
        w, h = img.size
        if w % self.factor != 0 or h % self.factor != 0:
            new_w = (w // self.factor) * self.factor
            new_h = (h // self.factor) * self.factor
            img = img.resize((new_w, new_h))
            den = den.resize((new_w, new_h))

        return img, den


class LabelScale(object):
    def __init__(self, label_factor):
        self.label_factor = label_factor

    def __call__(self, tensor):
        tensor = torch.from_numpy(np.array(tensor))
        tensor = tensor * self.label_factor
        return tensor


class DeNormalize(object):
    def __init__(self, mean, std):
        self.mean = mean
        self.std = std

    def __call__(self, tensor):
        for t, m, s in zip(tensor, self.mean, self.std):
            t.mul_(s).add_(m)
        return tensor
