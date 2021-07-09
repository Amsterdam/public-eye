import time

import numpy as np
import scipy
from scipy.ndimage.filters import gaussian_filter
import scipy.spatial
import glob
from matplotlib import pyplot as plt
import json
from PIL import ImageDraw, Image

import matplotlib

#partly borrowed from https://github.com/davideverona/deep-crowd-counting_crowdnet
def gaussian_filter_density(frame):
    '''
    This code use k-nearst, will take one minute or more to generate a density-map with one thousand people.

    points: a two-dimension list of pedestrians' annotation with the order [[col,row],[col,row],...].
    img_shape: the shape of the image, same as the shape of required density-map. (row,col). Note that can not have channel.

    return:
    density: the density-map we want. Same shape as input image but only has one channel.

    example:
    points: three pedestrians with annotation:[[163,53],[175,64],[189,74]].
    img_shape: (768,1024) 768 is row and 1024 is column.
    '''

    img = plt.imread(frame.get_image_path())
    points = np.array(frame.get_centers())

    img_shape=[img.shape[0],img.shape[1]]
    density = np.zeros(img_shape, dtype=np.float32)
    gt_count = len(points)
    if gt_count == 0:
        return density

    leafsize = 2048
    # build kdtree
    tree = scipy.spatial.KDTree(points.copy(), leafsize=leafsize)

    # query kdtree
    distances, locations = tree.query(points, k=4)

    for i, pt in enumerate(points):
        pt2d = np.zeros(img_shape, dtype=np.float32)
        if int(pt[1])<img_shape[0] and int(pt[0])<img_shape[1]:
            pt2d[int(pt[1]), int(pt[0])] = 1.
        else:
            continue
        if gt_count > 1:
            sigma = (distances[i][1]+distances[i][2]+distances[i][3])*0.1
        else:
            sigma = np.average(np.array(gt.shape))/2./2.
        density += gaussian_filter(pt2d, sigma, mode='constant', truncate=3.0)

    return density


def gaussian_filter_fixed_density(frame, sigma=16):
    img = plt.imread(frame.get_image_path())
    img_shape = [img.shape[0], img.shape[1]]

    density = np.zeros(img_shape, dtype=np.float32)
    for dot in frame.get_centers():
        if dot[1] >= img.shape[0] or dot[1] < 0 or dot[0] >= img.shape[1] or dot[0] < 0:
            continue
        density[dot[1], dot[0]] = 1

    density = gaussian_filter(density, sigma, mode='constant')
    return density
