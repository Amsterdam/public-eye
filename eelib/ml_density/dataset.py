from torch.utils.data import Dataset
import random


class listDataset(Dataset):
    def __init__(
        self,
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

        if shuffle:
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

        return self.load_data(
            img_path_gt_path, train=self.train, enhance=self.enhance)
