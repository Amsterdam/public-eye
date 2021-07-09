import torch
import torchvision
import numpy as np
import eelib.ml_line_crossing_density.model_utils as model_utils

# Translated from original code in tensorflow. DDFlow


# What exact loss is this? Look for better explaination
def abs_robust_loss(diff, mask, q=0.4):
    diff = torch.pow(torch.abs(diff) + 0.01, q)
    diff = torch.mul(diff, mask)
    diff_sum = diff.sum()
    loss_mean = diff_sum / (mask.sum() * 2 + 1e-6)
    return loss_mean


def census_loss(frame1, frame2_warped, mask, max_distance=3):
    patch_size = 2 * max_distance + 1

    def _to_grayscale(images):
        images = images.cpu()
        images = [torchvision.transforms.ToPILImage()(x) for x in images]
        images = [torchvision.transforms.Grayscale()(x) for x in images]
        images = [torchvision.transforms.ToTensor()(x) for x in images]
        images = torch.stack(images).cuda()
        return images

    def _create_mask(tensor, paddings):
        inner_width = tensor.shape[2] - (paddings[0] + paddings[2])
        inner_height = tensor.shape[3] - (paddings[1] + paddings[3])
        inner = torch.ones([inner_width, inner_height]).cuda()

        mask2d = torch.nn.functional.pad(inner, paddings)
        mask = mask2d[None, None, :, :].expand_as(tensor)
        return mask

    def _ternary_transform(img):
        intensities = _to_grayscale(img)
        out_channels = patch_size * patch_size
        w = torch.tensor(np.eye(out_channels).reshape((out_channels, 1, patch_size, patch_size)), dtype=torch.float).cuda()
        patches = torch.nn.functional.conv2d(intensities, w, padding=(max_distance, max_distance))

        transf = patches - intensities
        transf_norm = transf / torch.sqrt(0.81 + torch.pow(transf, 2))

        return transf_norm

    def _hamming_distance(t1, t2):
        dist = torch.pow(t1 - t2, 2)
        dist_norm = dist / (0.1 + dist)
        dist_sum = dist_norm.sum(axis=1).reshape(dist_norm.shape[0], 1, dist_norm.shape[2], dist_norm.shape[3])
        return dist_sum

    t1 = _ternary_transform(frame1)
    t2 = _ternary_transform(frame2_warped)
    dist = _hamming_distance(t1, t2)

    transform_mask = _create_mask(mask, (max_distance, max_distance, max_distance, max_distance))
    return abs_robust_loss(dist, mask * transform_mask)


# The photometric losses
def create_photometric_losses(frame1, frame2, flow_fw, flow_bw):
    # Could be highly optimized
    losses = {}

    # 0/1 map with pixels which are occluded
    occ_fw, occ_bw = model_utils.occlusion(flow_fw, flow_bw)
    mask_fw = 1. - occ_fw
    mask_bw = 1. - occ_bw

    # Apply warp to move to the other frame
    img1_warp = model_utils.backwarp(frame1, flow_bw)
    img2_warp = model_utils.backwarp(frame2, flow_fw)

    census_losses = {}
    census_losses['no_occlusion'] = census_loss(frame1, img2_warp, torch.ones_like(mask_fw)) + \
                            census_loss(frame2, img1_warp, torch.ones_like(mask_bw))

    census_losses['occlusion'] = census_loss(frame1, img2_warp, mask_fw) + \
                              census_loss(frame2, img1_warp, mask_bw)

    # Calc photometric loss
    abs_losses = {}
    abs_losses['no_occlusion'] = abs_robust_loss(frame1 - img2_warp, torch.ones_like(mask_fw)) + \
                            abs_robust_loss(frame2 - img1_warp, torch.ones_like(mask_bw))

    abs_losses['occlusion'] = abs_robust_loss(frame1 - img2_warp, mask_fw) + \
                       abs_robust_loss(frame2 - img1_warp, mask_bw)

    losses['abs_robust_mean'] = abs_losses
    losses['census'] = census_losses

    return losses


# The photometric losses
def create_distilled_losses(flow_fw, flow_bw, patch_flow_fw, patch_flow_bw):

    # 0/1 map with pixels which are occluded
    occ_fw, occ_bw = model_utils.occlusion(flow_fw, flow_bw)
    patch_occ_fw, patch_occ_bw = model_utils.occlusion(patch_flow_fw, patch_flow_bw)

    valid_mask_fw = torch.clamp(patch_occ_fw - occ_fw, 0., 1.)
    valid_mask_bw = torch.clamp(patch_occ_bw - occ_bw, 0., 1.)

    loss = (abs_robust_loss(flow_fw - patch_flow_fw, valid_mask_fw) +
            abs_robust_loss(flow_bw - patch_flow_bw, valid_mask_bw)) / 2

    return loss
