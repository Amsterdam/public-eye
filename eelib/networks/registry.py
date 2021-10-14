from eelib.networks.CSRNet.model import CSRNet
from eelib.networks.YOLOv3.model import YOLOv3
from eelib.networks.GARB.model import GARB
from eelib.networks.LOID.new_model import LOID
from eelib.networks.LOID.new_model import LOID2
import eelib.networks.Transformer.models.DeiT.DeiTModels  # Needed to register models for 'create_model'
from timm.models import create_model
import torch
import sys
import os
from eelib.ml_object_recognition.models import load_darknet_weights
from eelib.networks.YOLOv5.models.experimental import attempt_load

def init_loi(nn, checkpoint_path, cuda, cuda_device):
    print("Init line crossing density NN from", checkpoint_path, 'cuda:', cuda)

    if not cuda:
        checkpoint = torch.load(
            checkpoint_path, map_location=torch.device('cpu'))
    else:
        print("init model with weights on cuda device", cuda_device)
        checkpoint = torch.load(
            checkpoint_path,
            map_location=torch.device('cuda:{}'.format(cuda_device)))

    nn.load_state_dict(checkpoint)
    if cuda:
        nn = nn.cuda()

    return nn


def load_csrnet(checkpoint_path, cuda, cuda_device):
    nn = CSRNet()

    if checkpoint_path:
        checkpoint = torch.load(
            checkpoint_path,
            map_location=torch.device('cpu'))

        nn.load_state_dict(checkpoint['state_dict'])

    if cuda:
        nn.to(torch.device('cuda:{}'.format(cuda_device)))

    return nn


def load_yolo(checkpoint_path, cuda, cuda_device):
    nn = YOLOv3()
    print("Init darknet NN from", checkpoint_path)

    if checkpoint_path:
        load_darknet_weights(nn, checkpoint_path)

    if cuda:
        nn.to(torch.device('cuda:{}'.format(cuda_device)))

    return nn

def load_garb(checkpoint_path, cuda, cuda_device):
    nn = GARB()
    print("Init darknet NN from", checkpoint_path)

    if checkpoint_path:
        load_darknet_weights(nn, checkpoint_path)

    if cuda:
        nn.to(torch.device('cuda:{}'.format(cuda_device)))

    return nn

def load_loi(checkpoint_path, cuda, cuda_device):
    nn = LOID()
    if checkpoint_path:
        nn = init_loi(nn, checkpoint_path, cuda, cuda_device)

    if cuda:
        nn.to(torch.device('cuda:{}'.format(cuda_device)))

    return nn


def load_loi2(checkpoint_path, cuda, cuda_device):
    nn = LOID2()
    if checkpoint_path:
        nn = init_loi(nn, checkpoint_path, cuda, cuda_device)

    if cuda:
        nn.to(torch.device('cuda:{}'.format(cuda_device)))

    return nn


def yolov5s(checkpoint_path, cuda, cuda_device):
    print("Attemping load: train_yolov5s.py")
    sys.path.append(
        os.path.join(
            os.environ['EAGLE_EYE_PATH'], 'eelib', 'networks', 'YOLOv5'))
    if not cuda:
        return attempt_load(checkpoint_path, map_location=torch.device('cpu'))
    else:
        print("init model with weights on cuda device", cuda_device)
        return attempt_load(
            checkpoint_path,
            map_location=torch.device('cuda:{}'.format(cuda_device))
        )


def init_transformer(checkpoint_path, cuda, cuda_device):
    model = create_model(
        'deit_base_distilled_patch16_224',
        init_path=checkpoint_path,
        num_classes=1000,  # Not used. But must match pretrained model!
        drop_rate=0.,
        drop_path_rate=0.,
        drop_block_rate=None,
    )

    if cuda:
        model = model.to(torch.device('cuda:{}'.format(cuda_device)))

    return model


def load_transformer(checkpoint_path, cuda, cuda_device):
    return init_transformer(checkpoint_path, cuda, cuda_device)


def enable_grad_last_layers(model, enable_number_of_layers):
    parameters = list(model.parameters())
    # disable all layers
    for param in parameters:
        param.requires_grad = False

    # enable train_last_layers
    rev = list(reversed(parameters))
    for i in range(
        0,
        min(len(rev) - 1, enable_number_of_layers + 1)
    ):
        param = rev[i]
        param.requires_grad = True


def get_network(
    network_name,
    cuda=True,
    model_path=None,
    cuda_device=0,
    train_last_layers=None,
):
    torch.cuda.empty_cache()

    model = None
    if network_name == "VICCT":
        model = load_transformer(model_path, cuda, cuda_device)
    if network_name == "CSRNet":
        model = load_csrnet(model_path, cuda, cuda_device)
    elif network_name == "Yolo v3":
        model = load_yolo(model_path, cuda, cuda_device)
    elif network_name == "Line of Interest Density":
        model = load_loi(model_path, cuda, cuda_device)
    elif network_name == "Line of Interest Density 2":
        model = load_loi2(model_path, cuda, cuda_device)
    elif network_name == "Yolo v3 Garbage":
        model = load_garb(model_path, cuda, cuda_device)

    if train_last_layers:
        enable_grad_last_layers(model, train_last_layers)

    return model
