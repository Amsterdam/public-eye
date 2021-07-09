from PIL import Image
import random
import numpy as np
import h5py
import torch
from torchvision import transforms
from eelib.networks.MCNN.models import MCNN
from eelib.ml_density.train_model_template import get_main


def load_data(img_gt_path, train=True, enhance=False):
    img_path, gt_path = img_gt_path
    img = Image.open(img_path).convert('RGB')
    gt_file = h5py.File(gt_path, mode='r')
    target = np.asarray(gt_file['density'])
    if False:
        crop_size = (img.size[0]/2, img.size[1]/2)
        if random.randint(0, 9) <= -1:
            dx = int(random.randint(0, 1)*img.size[0]*1./2)
            dy = int(random.randint(0, 1)*img.size[1]*1./2)
        else:
            dx = int(random.random()*img.size[0]*1./2)
            dy = int(random.random()*img.size[1]*1./2)

        img = img.crop((dx, dy, crop_size[0]+dx, crop_size[1]+dy))
        target = target[dy:crop_size[1]+dy, dx:crop_size[0]+dx]

        if random.random() > 0.8:
            target = np.fliplr(target)
            img = img.transpose(Image.FLIP_LEFT_RIGHT)

    img = img.crop((0, 0, int(img.size[0]/16) * 16, int(img.size[1]/16)*16))
    target = target[0:img.size[1], 0:img.size[0]]

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
   "scriptName" : "train_mcnn.py",
   "scriptArgs": {
        "train_dataset_id": 16,
        "val_dataset_id": 17,
        "epochs": 1
    }
}
"""

criterion = torch.nn.MSELoss(size_average=False).cuda()


def optimizer_constructor(model, args):
    return torch.optim.Adam(
        filter(lambda p: p.requires_grad,
               model.parameters()),
        lr=args['lr'], weight_decay=args['weight_decay'])


def scheduler_constructor(optimizer, args):
    return torch.optim.lr_scheduler.MultiStepLR(optimizer, gamma=args['gamma'],
                                                milestones=args['steps'])


main = get_main(
    args_file="modules/train_mcnn-args.json",
    script_name="train_mcnn.py",
    model_constructor=MCNN,
    criterion=criterion,
    optimizer_constructor=optimizer_constructor,
    scheduler_constructor=scheduler_constructor,
    load_data=load_data,
    transform=transform)

main()
