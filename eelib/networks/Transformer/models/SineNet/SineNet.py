import torch
import torch.nn as nn
import torch.nn.functional as F
from collections import OrderedDict


class SineNet(nn.Module):
    def __init__(self):
        super(SineNet, self).__init__()
        # self.net from https://github.com/infinitemugen/MAML-Pytorch
        self.net = nn.Sequential(OrderedDict([
            ('l1', nn.Linear(1, 40)),
            ('relu1', nn.ReLU()),
            ('l2', nn.Linear(40, 40)),
            ('relu2', nn.ReLU()),
            ('l3', nn.Linear(40, 1))
        ]))

        self.alpha = None

    def make_alpha(self, alpha_init):
        self.alpha = torch.nn.ParameterDict()
        for k, v in self.state_dict().items():
            alpha_value = torch.nn.Parameter(torch.zeros(v.shape, requires_grad=True) + alpha_init)
            self.alpha[k.replace('.', '_')] = alpha_value

    def forward(self, x):
        pred = self.net(x)
        return pred

