import os
import torch
import uuid
import random
import numpy as np
import h5py
import cv2
from PIL import Image

def save_checkpoint(state, filename=None):
    file_name = filename or os.environ['EAGLE_EYE_PATH'] + '/files/models/{}.pth.tar'.format(uuid.uuid4())
    torch.save(state, file_name)
    return file_name

def load_model_from_checkpoint(path, model):
    checkpoint = torch.load(path)
    return model.load_state_dict(checkpoint['state_dict'])

def load_data(img_gt_path, train = True, enhance=False):
    img_path, gt_path = img_gt_path
    img = Image.open(img_path).convert('RGB')
    gt_file = h5py.File(gt_path, mode='r')
    target = np.asarray(gt_file['density'])
    if enhance:
        rand_val = random.randint(0, 100)
        if rand_val > 10:
            crop_size = (img.size[0]/2, img.size[1]/2)

            if rand_val > 50:
                dx = int(random.randint(0,1) * img.size[0] * 1./2)
                dy = int(random.randint(0,1) * img.size[1] * 1./2)
            else:
                dx = int(random.random() * img.size[0] * 1./2)
                dy = int(random.random() * img.size[1] * 1./2)

            img = img.crop((dx, dy, crop_size[0] + dx, crop_size[1] + dy))
            target = target[dy:int(crop_size[1]) + dy, dx:int(crop_size[0]) + dx]

            rand_val = random.randint(0, 100)

            if rand_val >= 50:
                target = np.fliplr(target)
                img = img.transpose(Image.FLIP_LEFT_RIGHT)

    target = cv2.resize(target,(target.shape[1]//8,target.shape[0]//8),interpolation = cv2.INTER_CUBIC)*64

    return img, target
