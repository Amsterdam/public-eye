import torchvision.transforms as standard_transforms
from torch.utils.data import DataLoader
import datasets.transforms as own_transforms
from datasets.dataset_utils import img_equal_split

from .settings import cfg_data
from .SineWave_Meta import SineWave_Meta, SineWave_Meta_eval


def loading_data():
    train_set = SineWave_Meta()
    train_loader = DataLoader(train_set,
                              batch_size=cfg_data.TRAIN_BS,
                              num_workers=cfg_data.N_WORKERS,
                              shuffle=True, drop_last=True)

    val_loaders = []
    for i in range(cfg_data.N_EVAL_DISTRIBUTIONS):
        val_dataset = SineWave_Meta_eval(f'Distribution {i + 1}')
        val_loader = DataLoader(val_dataset,
                                batch_size=cfg_data.TEST_BS,
                                num_workers=cfg_data.N_WORKERS,
                                shuffle=True, drop_last=True)
        val_loaders.append(val_loader)

    test_loaders = []
    for i in range(cfg_data.N_TEST_DISTRIBUTIONS):
        test_dataset = SineWave_Meta_eval(f'Distribution {i + 1}')
        test_loader = DataLoader(test_dataset,
                                 batch_size=cfg_data.TEST_BS,
                                 num_workers=cfg_data.N_WORKERS,
                                 shuffle=True, drop_last=True)
        test_loaders.append(test_loader)

    # No restore transform
    return train_loader, val_loaders, test_loaders, None
