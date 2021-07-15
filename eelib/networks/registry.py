import torch
import sys
import os
from eelib.ml_object_recognition.models import load_darknet_weights
from eelib.networks.YOLOv5.models.experimental import attempt_load


class NNRegistry(object):
    def get_network(self, network_name, cuda=True, model_path=None, type="object_recognition", cuda_device=0):
        torch.cuda.empty_cache()
        nn = None

        if network_name == "train_csrnet.py":
            from eelib.networks.CSRNet.model import CSRNet
            nn = CSRNet({})
        elif network_name == "train_cacc.py":
            from eelib.networks.CACC.model import CANNet
            nn = CANNet()
        elif network_name == "train_mcnn.py":
            from eelib.networks.MCNN.models import MCNN
            nn = MCNN()
        elif network_name == "train_yolo.py":
            from eelib.networks.YOLOv3.model import YOLOv3
            nn = YOLOv3()
        elif network_name == "train_loi_density.py":
            # Load LOID
            from eelib.networks.LOID.new_model import LOID
            nn = LOID()
        elif network_name == "train_loi_density2.py":
            # Load LOID
            from eelib.networks.LOID.new_model import LOID2
            nn = LOID2()
        elif network_name == "train_yolov5s.py":
            from eelib.networks.YOLOv5.model import YOLOv5
            nn = YOLOv5()

        if nn != None and cuda == True:
            nn = nn.cuda()
        elif nn != None:
            nn = nn.cpu()

        if model_path:
            return self.init_model(nn, model_path, type, cuda, cuda_device, network_name)
        else:
            return nn

    def init_yolov5(self, checkpoint_path, cuda, cuda_device=0):
        sys.path.append(os.path.join(os.environ['EAGLE_EYE_PATH'], 'eelib', 'networks', 'YOLOv5'))
        if cuda == False:
            return attempt_load(checkpoint_path, map_location=torch.device('cpu'))
        else:
            print("init model with weights on cuda device", cuda_device)
            return attempt_load(checkpoint_path, map_location=torch.device('cuda:{}'.format(cuda_device)))

    def init_model(self, nn, checkpoint_path, nn_type, cuda, cuda_device=0, network_name=None):
        if network_name == "train_yolov5s.py":
            print("Attemping load: train_yolov5s.py")
            sys.path.append(os.path.join(os.environ['EAGLE_EYE_PATH'], 'eelib', 'networks', 'YOLOv5'))
            if cuda == False:
                return attempt_load(checkpoint_path, map_location=torch.device('cpu'))
            else:
                print("init model with weights on cuda device", cuda_device)
                return attempt_load(checkpoint_path, map_location=torch.device('cuda:{}'.format(cuda_device)))
        elif (nn_type == "density_estimation"):
            print("Init density NN from", checkpoint_path, 'cuda:', cuda)

            if cuda == False:
                checkpoint = torch.load(checkpoint_path, map_location=torch.device('cpu'))
            else:
                print("init model with weights on cuda device", cuda_device)
                checkpoint = torch.load(checkpoint_path, map_location=torch.device('cuda:{}'.format(cuda_device)))

            nn.load_state_dict(checkpoint['state_dict'])
            return nn
        elif (nn_type == "object_recognition"):
            print("Init darknet NN from", checkpoint_path)
            load_darknet_weights(nn, checkpoint_path)

            return nn
        elif (nn_type == "line_crossing_density"):
            print("Init line crossing density NN from", checkpoint_path, 'cuda:', cuda)
            nn.load_state_dict(torch.load(checkpoint_path))
            return nn
