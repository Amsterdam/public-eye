# See LICENCE for copyright.

import numpy as np
import torch
import torch.backends.cudnn as cudnn
import os
import random
import importlib
from shutil import copyfile, copytree

from trainer_meta import Trainer
from config import cfg


# CSRNet
from models.CSRNet.CSRNet import CSRNet
from models.CSRNet.CSRNet_functional import CSRNet_functional
from models.CSRNet.meta_CSRNet import MetaCSRNet

# SineNet
from models.SineNet.SineNet import SineNet
from models.SineNet.SineNet_functional import SineNet_functional
from models.SineNet.meta_SineNet import MetaSineNet

# DeiT
import models.DeiT.DeiTModels  # Needed for 'create_model'
import models.DeiT.DeiTModelsFunctional  # Needed for 'create_model'
from timm.models import create_model
from models.DeiT.meta_DeiT import MetaDeiT


model_mapping = {
    'deit_tiny_cnn_patch16_224': 'https://dl.fbaipublicfiles.com/deit/deit_tiny_patch16_224-a1311bcf.pth',
    'deit_tiny_patch16_224': 'https://dl.fbaipublicfiles.com/deit/deit_tiny_patch16_224-a1311bcf.pth',
    'deit_tiny_distilled_patch16_224': 'https://dl.fbaipublicfiles.com/deit/deit_tiny_distilled_patch16_224-b40b3cf7.pth',
    'deit_small_patch16_224': 'https://dl.fbaipublicfiles.com/deit/deit_small_patch16_224-cd65a155.pth',
    'deit_small_distilled_patch16_224': 'https://dl.fbaipublicfiles.com/deit/deit_small_distilled_patch16_224-649709d9.pth',
    'deit_base_patch16_224': 'https://dl.fbaipublicfiles.com/deit/deit_base_patch16_224-b5f2ef4d.pth',
    'deit_base_distilled_patch16_224': 'https://dl.fbaipublicfiles.com/deit/deit_base_distilled_patch16_224-df68dfff.pth',
    'deit_base_patch16_384': 'https://dl.fbaipublicfiles.com/deit/deit_base_patch16_384-8de9b5d1.pth',
    'deit_base_distilled_patch16_384': 'https://dl.fbaipublicfiles.com/deit/deit_base_distilled_patch16_384-d0272ac0.pth'
}


def make_save_dirs(loaded_cfg):
    if not os.path.exists(loaded_cfg.SAVE_DIR):
        os.mkdir(loaded_cfg.SAVE_DIR)
        os.mkdir(loaded_cfg.PICS_DIR)
        os.mkdir(loaded_cfg.STATE_DICTS_DIR)
        os.mkdir(loaded_cfg.CODE_DIR)
        with open(os.path.join(cfg.SAVE_DIR, '__init__.py'), 'w') as f:  # For dynamic loading of config file
            pass
    else:
        print('save directory already exists!')


def main(cfg):
    if cfg.RESUME:
        module = importlib.import_module(cfg.RESUME_DIR.replace(os.sep, '.') + 'code.config')
        cfg = module.cfg
    else:
        make_save_dirs(cfg)
        copyfile('config.py', os.path.join(cfg.CODE_DIR, 'config.py'))
        copyfile('trainer_meta.py', os.path.join(cfg.CODE_DIR, 'trainer_meta.py'))
        copyfile(os.path.join('datasets', 'meta', cfg.DATASET, 'settings.py'),
                 os.path.join(cfg.CODE_DIR, 'settings.py'))
        copyfile(os.path.join('datasets', 'meta', cfg.DATASET, 'loading_data.py'),
                 os.path.join(cfg.CODE_DIR, 'loading_data.py'))
        copyfile(os.path.join('datasets', 'meta', cfg.DATASET, cfg.DATASET + '.py'),
                 os.path.join(cfg.CODE_DIR, cfg.DATASET + '.py'))
        copytree(os.path.join('models', cfg.MODEL),
                 os.path.join(cfg.CODE_DIR, cfg.MODEL))

    # Seeds for reproducibility
    torch.manual_seed(cfg.SEED)
    np.random.seed(cfg.SEED)
    random.seed(cfg.SEED)
    cudnn.benchmark = True

    dataloader = importlib.import_module(f'datasets.meta.{cfg.DATASET}.loading_data').loading_data
    cfg_data = importlib.import_module(f'datasets.meta.{cfg.DATASET}.settings').cfg_data

    print(f"Creating model: {cfg.MODEL}")
    criterion = torch.nn.MSELoss()

    if cfg.MODEL == 'CSRNet':
        model = CSRNet()
        model_functional = CSRNet_functional()
        meta_wrapper = MetaCSRNet(model, model_functional, criterion)

    elif cfg.MODEL == 'SineNet':
        model = SineNet()
        model_functional = SineNet_functional()
        meta_wrapper = MetaSineNet(model, model_functional, criterion)

    else:
        model = create_model(
            cfg.DeiT_MODEL,
            init_path=model_mapping[cfg.DeiT_MODEL],
            num_classes=1000,  # Must match pretrained model!
            drop_rate=0.,
            drop_path_rate=0.,
            drop_block_rate=None,
        )

        model_functional = create_model(
            cfg.DeiT_MODEL + '_functional',
            init_path=None,
            num_classes=1000,  # Must match pretrained model!
            drop_rate=0.,
            drop_path_rate=0.,
            drop_block_rate=None,
        )

        model.cuda()
        meta_wrapper = MetaDeiT(model, model_functional, criterion, cfg_data)

    model.make_alpha(cfg.ALPHA_INIT)
    model.cuda()

    n_parameters = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print('number of params:', n_parameters)

    trainer = Trainer(meta_wrapper, dataloader, cfg, cfg_data)
    trainer.train()  # Train the model


if __name__ == '__main__':
    main(cfg)
