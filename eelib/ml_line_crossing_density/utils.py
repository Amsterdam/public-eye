# Return a RGB image based on a optical flow map
import datetime
import cv2
import numpy as np
import torch


def load_model_from_checkpoint(path, model):
    checkpoint = torch.load(path)
    return model.load_state_dict(checkpoint)


class AverageMeter(object):
    """Computes and stores the average and current value"""
    def __init__(self):
        self.reset()

    def reset(self):
        self.val = 0
        self.avg = 0
        self.sum = 0
        self.count = 0

    def update(self, val, n=1):
        self.val = val
        self.sum += val * n
        self.count += n
        self.avg = self.sum / self.count


class AverageContainer:
    def __init__(self):
        self.meters = {}

    def __getitem__(self, item):
        if item not in self.meters:
            self.meters[item] = AverageMeter()
        return self.meters[item]

    def reset(self):
        self.meters = {}


def norm_to_img(tensor):
    return tensor / tensor.max()


class sTimer():
    def __init__(self, name):
        self.start = datetime.datetime.now()
        self.name = name

    def show(self, printer=True):
        ms = int((datetime.datetime.now() - self.start).total_seconds() * 1000)
        if printer:
            print("{}: {}ms".format(self.name, ms))

        return ms


# Return a RGB image based on a optical flow map
def flo_to_color(flo):
    hsv = np.zeros((flo.shape[0], flo.shape[1], 3), dtype=np.uint8)
    n = 8
    max_flow = flo.max()
    mag, ang = cv2.cartToPolar(flo[:, :, 0], flo[:, :, 1])
    hsv[:, :, 0] = ang * 180 / np.pi / 2
    hsv[:, :, 1] = np.clip(mag*n/max_flow*255, 0, 255)/3
    hsv[:, :, 2] = 255
    bgr = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    RGB_im = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    return RGB_im


def save_loi_sample(name, img, cc, fe, results=[]):
    img.save('imgs/{}_orig.jpg'.format(name))
    #total_img = img.convert("L").convert("RGBA")

    cc_img = Image.fromarray(cc * 255.0 / cc.max())
    cc_img = cc_img.convert("L")
    cc_img.save('imgs/{}_crowd.jpg'.format(name))

    # Transform CC model and merge with original image for demo
    # cc_img = np.zeros((cc.shape[0], cc.shape[1], 4))
    # cc_img = cc_img.astype(np.uint8)
    # cc_img[:, :, 3] = 255 - (cc * 255.0 / cc.max())
    # cc_img[cc_img > 2] = cc_img[cc_img > 2] * 0.4
    # cc_img = Image.fromarray(cc_img, 'RGBA')
    # total_img = Image.alpha_composite(total_img, cc_img)

    fe_img = Image.fromarray(np.uint8(flo_to_color(fe)), mode='RGB')
    fe_img.save('imgs/{}_fe.jpg'.format(name))

    cc_img = cc_img.convert('RGB')

    blended = Image.blend(cc_img, fe_img, alpha=0.5)
    blended.save('imgs/{}_full.jpg'.format(name))
