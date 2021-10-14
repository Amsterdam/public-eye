import torchvision.transforms as standard_transforms
from torch.utils.data import DataLoader
import datasets.transforms as own_transforms

from .settings import cfg_data
from .SHTA_DeiT import SHTA_DeiT


def loading_data(crop_size):
    # train transforms
    train_main_transform = own_transforms.Compose([
        own_transforms.RandomHorizontallyFlip()
    ])

    train_img_transform = standard_transforms.Compose([
        own_transforms.RandomGrayscale(),
        standard_transforms.ToTensor(),
        standard_transforms.Normalize(*cfg_data.MEAN_STD)
    ])

    train_gt_transform = standard_transforms.Compose([
        own_transforms.LabelScale(cfg_data.LABEL_FACTOR)
    ])

    train_cropper = own_transforms.Compose([
        own_transforms.RandomTensorCrop([crop_size, crop_size])
    ])

    # Val/Test transforms
    val_main_transform = None

    val_img_transform = standard_transforms.Compose([
        standard_transforms.ToTensor(),
        standard_transforms.Normalize(*cfg_data.MEAN_STD)
    ])

    val_gt_transform = standard_transforms.Compose([
        own_transforms.LabelScale(cfg_data.LABEL_FACTOR)
    ])

    val_cropper = None

    # Restore transform
    restore_transform = standard_transforms.Compose([
        own_transforms.DeNormalize(*cfg_data.MEAN_STD),
        standard_transforms.ToPILImage()
    ])

    train_set = SHTA_DeiT(cfg_data.DATA_PATH, 'train', crop_size,
                          main_transform=train_main_transform,
                          img_transform=train_img_transform,
                          gt_transform=train_gt_transform,
                          cropper=train_cropper)
    train_loader = DataLoader(train_set,
                              batch_size=cfg_data.TRAIN_BS,
                              num_workers=cfg_data.N_WORKERS,
                              shuffle=True, drop_last=True)

    val_set = SHTA_DeiT(cfg_data.DATA_PATH, 'val', crop_size,
                        main_transform=val_main_transform,
                        img_transform=val_img_transform,
                        gt_transform=val_gt_transform,
                        cropper=val_cropper)
    val_loader = DataLoader(val_set,
                            batch_size=cfg_data.VAL_BS,
                            num_workers=cfg_data.N_WORKERS,
                            shuffle=False, drop_last=False)

    test_set = SHTA_DeiT(cfg_data.DATA_PATH, 'test', crop_size,
                         main_transform=val_main_transform,
                         img_transform=val_img_transform,
                         gt_transform=val_gt_transform,
                         cropper=val_cropper)
    test_loader = DataLoader(test_set,
                             batch_size=cfg_data.VAL_BS,
                             num_workers=cfg_data.N_WORKERS,
                             shuffle=False, drop_last=False)

    return train_loader, val_loader, test_loader, restore_transform
