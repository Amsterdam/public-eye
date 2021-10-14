from easydict import EasyDict as edict
import os

cfg_data = edict()

cfg_data.TRAIN_BS = 1
cfg_data.TEST_BS = 1
cfg_data.N_WORKERS = 0

cfg_data.K_TRAIN = 10  # D
cfg_data.K_META = 10   # D'

cfg_data.LABEL_FACTOR = 1

cfg_data.N_EVAL_DISTRIBUTIONS = 10  # Evaluate the model on this many random Sine distributions.
cfg_data.N_TEST_DISTRIBUTIONS = 10  # Provided since Crowd Counting datasets have test sets. Not used during training.
cfg_data.N_EVAL_POINTS = 100  # We evaluate our model on N many random data points sampled from a Sine distribution.

