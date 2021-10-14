import os

import numpy as np
import pandas as pd

from PIL import Image
import csv

import scipy.ndimage
from datasets.dataset_utils import generate_density_municipality

data_path = ''  # Folder containing the images
img_file_extension = '.png'
data_files = [os.path.join(data_path, filename) for filename in os.listdir(data_path)
              if filename.endswith(img_file_extension)]

for img_path in data_files:
    gt_path = img_path.replace(img_file_extension, '-tags.csv')
    den_path = img_path.replace(img_file_extension, '-den.csv')
    img = Image.open(img_path)
    if img.mode == 'L':
        img = img.convert('RGB')

    dots = pd.read_csv(gt_path, header=0).values
    den = generate_density_municipality(img, dots, 4)
    den = den.astype(np.float32)
    with open(den_path, 'w', newline='') as f:
        writer = csv.writer(f, delimiter=',', quoting=csv.QUOTE_MINIMAL)
        for line in den:
            writer.writerow(line)
