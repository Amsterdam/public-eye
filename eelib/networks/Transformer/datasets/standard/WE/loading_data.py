import torchvision.transforms as standard_transforms
from torch.utils.data import DataLoader
import eelib.ml_transformer.datasets.transforms as own_transforms

from .settings import cfg_data
from .WE import WE


def loading_data(crop_size):
    train_main_transform = own_transforms.Compose([
        own_transforms.RandomCrop([crop_size, crop_size]),
        own_transforms.RandomHorizontallyFlip()
    ])

    img_transform = standard_transforms.Compose([
        standard_transforms.ToTensor(),
        standard_transforms.Normalize(*cfg_data.MEAN_STD)
    ])

    gt_transform = standard_transforms.Compose([
        own_transforms.LabelScale(cfg_data.LABEL_FACTOR)
    ])

    restore_transform = standard_transforms.Compose([
        own_transforms.DeNormalize(*cfg_data.MEAN_STD),
        standard_transforms.ToPILImage()
    ])

    train_set = WE(cfg_data.DATA_PATH + '/train', 'train', crop_size,
                   main_transform=train_main_transform,
                   img_transform=img_transform,
                   gt_transform=gt_transform)
    train_loader = DataLoader(train_set,
                              batch_size=cfg_data.TRAIN_BS,
                              num_workers=cfg_data.N_WORKERS,
                              shuffle=True, drop_last=True)

    test_set = WE(cfg_data.DATA_PATH + '/test', 'test', crop_size,
                  main_transform=None,
                  img_transform=img_transform,
                  gt_transform=gt_transform)
    test_loader = DataLoader(test_set,
                             batch_size=cfg_data.TEST_BS,
                             num_workers=cfg_data.N_WORKERS,
                             shuffle=False, drop_last=False)

    return train_loader, test_loader, restore_transform
