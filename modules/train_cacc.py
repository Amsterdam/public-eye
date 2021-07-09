import torch
import h5py
from PIL import Image
from torchvision import transforms
from eelib.ml_density.train_model_template import get_main
import cv2
import random
import numpy as np
from eelib.networks.CACC.model import CANNet


def load_data(img_gt_path, train=True, enhance=False):
    img_path, gt_path = img_gt_path
    img = Image.open(img_path).convert('RGB')
    gt_file = h5py.File(gt_path, mode='r')
    target = np.asarray(gt_file['density'])
    if train:
        ratio = 0.5
        crop_size = (int(img.size[0]*ratio), int(img.size[1]*ratio))
        rdn_value = random.random()
        if rdn_value < 0.25:
            dx = 0
            dy = 0
        elif rdn_value < 0.5:
            dx = int(img.size[0]*ratio)
            dy = 0
        elif rdn_value < 0.75:
            dx = 0
            dy = int(img.size[1]*ratio)
        else:
            dx = int(img.size[0]*ratio)
            dy = int(img.size[1]*ratio)

        img = img.crop((dx, dy, crop_size[0] + dx, crop_size[1]+dy))
        target = target[dy:(crop_size[1]+dy), dx:(crop_size[0]+dx)]
        if random.random() > 0.8:
            target = np.fliplr(target)
            img = img.transpose(Image.FLIP_LEFT_RIGHT)

    target = cv2.resize(
        target,
        (target.shape[1] // 8, target.shape[0]//8),
        interpolation=cv2.INTER_CUBIC)*64

    return img, target


transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])


"""
example
{
   "scriptName" : "train_cacc.py",
   "scriptArgs": {
        "train_dataset_id": 16,
        "val_dataset_id": 17,
        "epochs": 1
    }
}
"""

criterion = torch.nn.MSELoss(size_average=False).cuda()


def optimizer_constructor(model, args):
    return torch.optim.SGD(filter(lambda p: p.requires_grad,
                                  model.parameters()),
                           args['lr'],
                           momentum=args['momentum'],
                           weight_decay=args['decay'])


def scheduler_constructor(optimizer, args):
    return torch.optim.lr_scheduler.MultiStepLR(optimizer,
                                                gamma=args['gamma'],
                                                milestones=args['steps'])


main = get_main(
    script_name="train_cacc.py",
    args_file="modules/train_cacc-args.json",
    model_constructor=CANNet,
    criterion=criterion,
    optimizer_constructor=optimizer_constructor,
    scheduler_constructor=scheduler_constructor,
    load_data=load_data,
    transform=transform)

main()
