import torchvision.transforms as standard_transforms
from torch.utils.data import DataLoader
import eelib.ml_transformer.datasets.transforms as own_transforms

from .settings import cfg_data
from .Multiset_DeiT import Multiset_DeiT


def loading_data(crop_size):
    # train transforms
    crop_size = 224

    train_main_transform = own_transforms.Compose([
        own_transforms.RandomCrop([crop_size, crop_size]),
        own_transforms.RandomHorizontallyFlip()
    ])

    train_img_transform = standard_transforms.Compose([
        standard_transforms.ToTensor(),
        standard_transforms.Normalize(*cfg_data.MEAN_STD)
    ])

    val_img_transform = standard_transforms.Compose([
        standard_transforms.ToTensor(),
        standard_transforms.Normalize(*cfg_data.MEAN_STD)
    ])

    gt_transform = standard_transforms.Compose([
        own_transforms.LabelScale(cfg_data.LABEL_FACTOR)
    ])

    train_cropper = own_transforms.Compose([
        own_transforms.RandomTensorCrop([crop_size, crop_size])
    ])

    restore_transform = standard_transforms.Compose([
        own_transforms.DeNormalize(*cfg_data.MEAN_STD),
        standard_transforms.ToPILImage()
    ])

    train_set = Multiset_DeiT(cfg_data.TRAIN_BASE_PATHS, 'train', crop_size,
                              main_transform=train_main_transform,
                              img_transform=train_img_transform,
                              gt_transform=gt_transform,
                              cropper=train_cropper)
    train_loader = DataLoader(train_set,
                              batch_size=cfg_data.TRAIN_BS,
                              num_workers=cfg_data.N_WORKERS,
                              shuffle=True, drop_last=True)

    val_set = Multiset_DeiT(cfg_data.VAL_BASE_PATHS, 'val', crop_size,
                            main_transform=None,
                            img_transform=val_img_transform,
                            gt_transform=gt_transform,
                            cropper=None)
    val_loader = DataLoader(val_set,
                            batch_size=cfg_data.VAL_BS,
                            num_workers=cfg_data.N_WORKERS,
                            shuffle=False, drop_last=False)

    test_set = Multiset_DeiT(cfg_data.TEST_BASE_PATHS, 'test', crop_size,
                             main_transform=None,
                             img_transform=val_img_transform,
                             gt_transform=gt_transform,
                             cropper=None)
    test_loader = DataLoader(test_set,
                             batch_size=cfg_data.VAL_BS,
                             num_workers=cfg_data.N_WORKERS,
                             shuffle=False, drop_last=False)

    return train_loader, val_loader, test_loader, restore_transform
