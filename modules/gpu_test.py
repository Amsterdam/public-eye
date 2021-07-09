import time
# test access to eelib
import eelib.job as job

# test virtual env imports
import PIL.Image as Image
import numpy as np
from scipy.ndimage.filters import gaussian_filter
import scipy
import scipy.spatial
import torch

def main():
    print("run test job")

    job_args = job.get_job_args()

    gpu_avail = torch.cuda.is_available()
    print("has gpu: {}".format(gpu_avail))

    n_gpus = torch.cuda.device_count()
    print("# gpus: {}".format(n_gpus))

    # test async stuff from node
    for i in range(0, n_gpus):
        print("gpu[{}]: {}".format(i, torch.cuda.get_device_name(i)))
    print('done')

main()
