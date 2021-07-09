from torch.utils.data import Dataset
import PIL.Image as Image
import numpy as np
import random

class listDataset(Dataset):
    def __init__(self,
        root,
        load_data,
        shape=None,
        shuffle=True,
        transform=None,
        train=False,
        seen=0,
        batch_size=1,
        num_workers=4,
        scale_factor=1,
        enhance=False
    ):
        if train:
            if enhance:
                root = root * 8
            else:
                root = root * 4
        random.shuffle(root)

        self.nSamples = len(root)
        self.lines = root
        self.transform = transform
        self.train = train
        self.shape = shape
        self.seen = seen
        self.batch_size = batch_size
        self.num_workers = num_workers
        self.load_data = load_data
        self.scale_factor = scale_factor
        self.enhance = enhance

    def __len__(self):
        return self.nSamples

    def __getitem__(self, index):
        assert index <= len(self), 'index range error'

        img_path_gt_path = self.lines[index]

        img, target = self.load_data(img_path_gt_path, train=self.train, enhance=self.enhance)

        if self.scale_factor != 1.0:
            target_img = Image.fromarray(target)

            new_target_w = int(target_img.width * self.scale_factor)
            new_target_h = int(target_img.height * self.scale_factor)

            new_img_w = int(img.width * self.scale_factor)
            new_img_h = int(img.height * self.scale_factor)

            if (new_img_h % new_target_h != 0):
                new_target_h += 1
            if (new_img_w % new_target_w != 0):
                new_target_w += 1

            target_img = target_img.resize((new_target_w, new_target_h), resample=Image.LANCZOS)
            target = np.array(target_img)

            img = img.resize((new_img_w, new_img_h), resample=Image.LANCZOS)

        img = self.transform(img)

        return img, target