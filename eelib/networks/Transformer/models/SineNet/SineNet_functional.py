import torch
import torch.nn as nn
import torch.nn.functional as F
from collections import OrderedDict


class SineNet_functional(nn.Module):
    """ Allows for a forward pass through SineNet, given only the weights. """
    def __init__(self):
        super(SineNet_functional, self).__init__()

    def forward(self, x, weights, training=True):
        x = F.linear(x, weights['net.l1.weight'], weights['net.l1.bias'])
        x = F.relu(x)
        x = F.linear(x, weights['net.l2.weight'], weights['net.l2.bias'])
        x = F.relu(x)
        pred = F.linear(x, weights['net.l3.weight'], weights['net.l3.bias'])

        return pred
