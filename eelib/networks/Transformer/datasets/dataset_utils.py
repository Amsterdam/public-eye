import math
import torch
import scipy.ndimage
import numpy as np


def generate_scaled_density(img, mat, sigma, scale):
    """ Creates the ground-truth density map.
        img: The image corresponding to the ground-truth annotations
        mat: The coordinates of the annotations.
        sigma: A constant sigma used for the gaussian filter.
        scale: With what scale was img resised. """

    w, h = img.size
    k = np.zeros((h, w))

    gt_points = mat["image_info"][0, 0][0, 0][0] * scale
    for (x, y) in gt_points.astype(int):
        if x < w and y < h:
            k[y, x] = 1  # Note the order of x and y here. Height is stored in first dimension
        else:
            print("This should never happen!")  # This would mean a head is annotated outside the image.
            print(x, y, w, h)

    density = scipy.ndimage.filters.gaussian_filter(k, sigma, mode='constant', truncate=2)
    return density


def generate_density_municipality(img, gt_points, sigma):
    w, h = img.size
    k = np.zeros((h, w))

    for (x, y, _) in gt_points.astype(int):
        if x < w and y < h:
            k[y, x] = 1  # Note the order of x and y here. Height is stored in first dimension\n",
        else:
            print("This should never happen!")  # This would mean a head is annotated outside the image.\n"
    density = scipy.ndimage.filters.gaussian_filter(k, sigma, mode='constant')
    return density


def img_equal_split(img, crop_size, overlap):
    channels, h, w = img.shape

    n_cols = (w - crop_size) / (crop_size - overlap) + 1
    n_cols = math.ceil(n_cols)  # At least this many crops needed to get >= overlap pixels of overlap
    n_rows = (h - crop_size) / (crop_size - overlap) + 1
    n_rows = math.ceil(n_rows)  # At least this many crops needed to get >= overlap pixels of overlap

    if n_cols > 1:
        overlap_w = crop_size - (w - crop_size) / (n_cols - 1)
        overlap_w = math.floor(overlap_w)
    else:  # edge case (SHTA)
        overlap_w = 0

    if n_rows > 1:
        overlap_h = crop_size - (h - crop_size) / (n_rows - 1)
        overlap_h = math.floor(overlap_h)
    else:  # edge case (SHTA)
        overlap_h = 0

    crops = torch.zeros((n_rows * n_cols, channels, crop_size, crop_size))

    for r in range(n_rows):
        for c in range(n_cols):
            y1 = r * (crop_size - overlap_h) if r * (crop_size - overlap_h) + crop_size <= h else h - crop_size
            y2 = y1 + crop_size
            x1 = c * (crop_size - overlap_w) if c * (crop_size - overlap_w) + crop_size <= w else w - crop_size
            x2 = x1 + crop_size

            item_idx = r * n_cols + c
            crops[item_idx, :, :, :] = img[:, y1:y2, x1:x2]

    return crops

    return crops


def img_equal_unsplit(crops, overlap, ignore_buffer, img_h, img_w, img_channels):
    w, h = img_w, img_h
    crop_size = crops.shape[-1]
    n_cols = (w - crop_size) / (crop_size - overlap) + 1
    n_cols = math.ceil(n_cols)  # At least this many crops needed to get >= overlap pixels of overlap
    n_rows = (h - crop_size) / (crop_size - overlap) + 1
    n_rows = math.ceil(n_rows)  # At least this many crops needed to get >= overlap pixels of overlap

    if n_cols > 1:
        overlap_w = crop_size - (w - crop_size) / (n_cols - 1)
        overlap_w = math.floor(overlap_w)
    else:
        overlap_w = 0

    if n_rows > 1:
        overlap_h = crop_size - (h - crop_size) / (n_rows - 1)
        overlap_h = math.floor(overlap_h)
    else:
        overlap_h = 0

    new_img = torch.zeros((img_channels, h, w))
    divider = torch.zeros((img_channels, h, w))

    for r in range(n_rows):
        for c in range(n_cols):
            y1 = r * (crop_size - overlap_h) if r * (crop_size - overlap_h) + crop_size <= h else h - crop_size
            y2 = y1 + crop_size
            x1 = c * (crop_size - overlap_w) if c * (crop_size - overlap_w) + crop_size <= w else w - crop_size
            x2 = x1 + crop_size

            ign_top = ignore_buffer if r != 0 else 0
            ign_bot = ignore_buffer if r != n_rows - 1 else 0
            ign_left = ignore_buffer if c != 0 else 0
            ign_right = ignore_buffer if c != n_cols - 1 else 0

            item_idx = r * n_cols + c
            new_img[:, y1 + ign_top:y2 - ign_bot, x1 + ign_left:x2 - ign_right] += \
                crops[item_idx, :, 0 + ign_top:crop_size - ign_bot, 0 + ign_left:crop_size - ign_right]
            divider[:, y1 + ign_top:y2 - ign_bot, x1 + ign_left:x2 - ign_right] += 1

    return new_img / divider
