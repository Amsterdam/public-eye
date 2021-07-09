from matplotlib import pyplot as plt
from scipy.ndimage.filters import gaussian_filter
from matplotlib import cm as CM
import matplotlib.pyplot as plt
import scipy
import scipy.spatial
import eelib.store as store
import numpy as np
import h5py

def store_gt(gt_path, gt):
    with h5py.File(gt_path, 'w') as hf:
        hf['density'] = gt

def store_gt_render(gt_render_path, gt):
    plt.imsave(gt_render_path, gt, cmap=CM.jet)

def gt_from_h5(h5_path):
    with h5py.File(h5_path, 'r') as hf:
        return np.asarray(hf['density'])

def gt_from_frame(frame, sigma=-1, beta=-1):
    tags = store.get_tags_for_frame(frame)
    gt = make_gt(frame.path, [(tag.x, tag.y) for tag in tags])

    if sigma > 0:
        return gaussian_fixed_sigma(gt, sigma)
    elif beta > 0:
        return gaussian_geometry_adaptive(gt, beta=beta)
    else:
        return gt

def make_gt(img_path, tags):
    """Generate groundtruth object

    Arguments:
    img_path -- path to image
    tags     -- list of (x, y) tuples (e.g. [(100, 200), (50, 30)]
    """
    img= plt.imread(img_path)
    k = np.zeros((img.shape[0],img.shape[1]))

    for i in range(0,len(tags)):
        if int(tags[i][1])<img.shape[0] and int(tags[i][0])<img.shape[1]:
            k[int(tags[i][1]),int(tags[i][0])]=1

    return k

def gaussian_fixed_sigma(gt, sigma):
    return scipy.ndimage.filters.gaussian_filter(gt, sigma)

def gaussian_geometry_adaptive(gt, beta=0.3):
    density = np.zeros(gt.shape, dtype=np.float32)

    pts = np.array(list(zip(np.nonzero(gt)[1], np.nonzero(gt)[0])))

    leafsize = 2048

    # build kdtree
    tree = scipy.spatial.KDTree(pts.copy(), leafsize=leafsize)
    # query kdtree
    distances, locations = tree.query(pts, k=4)

    for i, pt in enumerate(pts):
        pt2d = np.zeros(gt.shape, dtype=np.float32)
        pt2d[pt[1], pt[0]] = 1.
        if len(pts) > 1:
            sigma = ((distances[i][1]+distances[i][2]+distances[i][3])*beta)/3
        else:
            sigma = np.average(np.array(gt.shape))/2./2. #case: 1 point
        try:
            density += scipy.ndimage.filters.gaussian_filter(pt2d, sigma, mode='constant')
        except OverflowError as e:
            print(e)

    return density
