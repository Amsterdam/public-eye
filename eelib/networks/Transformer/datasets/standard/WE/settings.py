from easydict import EasyDict as edict

cfg_data = edict()

cfg_data.DATA_PATH = 'D:\\OneDrive\\OneDrive - UvA\\ThesisData\\Datasets\\WE_C3_PP_FSL'

cfg_data.TRAIN_BS = 10
cfg_data.TEST_BS = 1
cfg_data.N_WORKERS = 1

cfg_data.MEAN_STD = ([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
cfg_data.LABEL_FACTOR = 1000

