# Copyright (c) 2015-present, Facebook, Inc.
# All rights reserved.

# Architectures from Facebook are adjusted such that Crowd Counting can be performed.
import torch
import torch.nn as nn
import torch.nn.functional as F
from functools import partial

from models.DeiT.timm_functional.timm_functional import VisionTransformer_functional, _cfg
from timm.models.registry import register_model

__all__ = ['deit_tiny_distilled_patch16_224_functional',
           'deit_small_distilled_patch16_224_functional',
           'deit_base_distilled_patch16_224_functional']


# ======================================================================================================= #
#                                        MODULES TO DO REGRESSION                                         #
# ======================================================================================================= #

class DeiTRegressionHead_functional(nn.Module):
    def __init__(self, crop_size):
        super().__init__()

        self.crop_size = crop_size

    def forward(self, pre_den, weights):
        pre_den = F.linear(pre_den, weights['regression_head.regression_head.lin_scaler.0.weight'],
                           bias=weights['regression_head.regression_head.lin_scaler.0.bias'])
        pre_den = F.relu(pre_den)
        pre_den = F.linear(pre_den, weights['regression_head.regression_head.lin_scaler.2.weight'],
                           bias=weights['regression_head.regression_head.lin_scaler.2.bias'])

        pre_den = pre_den.transpose(1, 2)
        den = F.fold(pre_den, (self.crop_size, self.crop_size), kernel_size=16, stride=16)

        return den


class DistilledRegressionTransformer_functional(VisionTransformer_functional):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.regression_head = DeiTRegressionHead_functional(kwargs['img_size'])

    def forward(self, x, weights, training):
        # taken from https://github.com/rwightman/pytorch-image-models/blob/master/timm/models/vision_transformer.py
        # Adjusted to do Crowd Counting regression

        batch_size = x.shape[0]
        x = self.patch_embed(x, weights)

        # This token has been stolen by a lot of people now
        cls_tokens = weights['cls_token'].expand(batch_size, -1, -1)
        dist_token = weights['dist_token'].expand(batch_size, -1, -1)
        x = torch.cat((cls_tokens, dist_token, x), dim=1)

        x = x + weights['pos_embed']
        x = F.dropout(x, self.drop_rate, training=training)

        for blk in self.blocks:
            x = blk(x, weights, training)

        pre_den = x[:, 2:]

        den = self.regression_head(pre_den, weights)

        return den


# ======================================================================================================= #
#                                        REGISTER DISTILLED MODELS                                        #
# ======================================================================================================= #

@register_model
def deit_tiny_distilled_patch16_224_functional(init_path=None, pretrained=False, **kwargs):
    model = DistilledRegressionTransformer_functional(
        img_size=224, patch_size=16, embed_dim=192, depth=12, num_heads=3, mlp_ratio=4, qkv_bias=True,
        norm_layer=partial(nn.LayerNorm, eps=1e-6), **kwargs)

    model.default_cfg = _cfg()
    model.crop_size = 224
    model.n_patches = 14

    return model


@register_model
def deit_small_distilled_patch16_224_functional(init_path=None, pretrained=False, **kwargs):
    model = DistilledRegressionTransformer_functional(
        img_size=224, patch_size=16, embed_dim=384, depth=12, num_heads=6, mlp_ratio=4, qkv_bias=True,
        norm_layer=partial(nn.LayerNorm, eps=1e-6), **kwargs)

    model.default_cfg = _cfg()
    model.crop_size = 224
    model.n_patches = 14

    return model

@register_model
def deit_base_distilled_patch16_224_functional(init_path=None, pretrained=False, **kwargs):
    model = DistilledRegressionTransformer_functional(
        img_size=224, patch_size=16, embed_dim=768, depth=12, num_heads=12, mlp_ratio=4, qkv_bias=True,
        norm_layer=partial(nn.LayerNorm, eps=1e-6), **kwargs)

    model.default_cfg = _cfg()
    model.crop_size = 224
    model.n_patches = 14

    return model
