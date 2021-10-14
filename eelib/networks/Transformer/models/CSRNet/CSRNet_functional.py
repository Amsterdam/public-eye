import torch.nn as nn
import torch
from torchvision import models
import torch.nn.functional as F


class CSRNet_functional(nn.Module):
    def __init__(self, load_weights=False):
        super(CSRNet_functional, self).__init__()

    def forward(self, x, weights, training=True):
        # Frontend
        x = F.conv2d(x, weights['frontend.0.weight'], bias=weights['frontend.0.bias'], padding=1)
        x = F.relu(x, inplace=True)
        x = F.conv2d(x, weights['frontend.2.weight'], bias=weights['frontend.2.bias'], padding=1)
        x = F.relu(x, inplace=True)
        x = F.max_pool2d(x, kernel_size=2, stride=2)
        x = F.conv2d(x, weights['frontend.5.weight'], bias=weights['frontend.5.bias'], padding=1)
        x = F.relu(x, inplace=True)
        x = F.conv2d(x, weights['frontend.7.weight'], bias=weights['frontend.7.bias'], padding=1)
        x = F.relu(x, inplace=True)
        x = F.max_pool2d(x, kernel_size=2, stride=2)
        x = F.conv2d(x, weights['frontend.10.weight'], bias=weights['frontend.10.bias'], padding=1)
        x = F.relu(x, inplace=True)
        x = F.conv2d(x, weights['frontend.12.weight'], bias=weights['frontend.12.bias'], padding=1)
        x = F.relu(x, inplace=True)
        x = F.conv2d(x, weights['frontend.14.weight'], bias=weights['frontend.14.bias'], padding=1)
        x = F.relu(x, inplace=True)
        x = F.max_pool2d(x, kernel_size=2, stride=2)
        x = F.conv2d(x, weights['frontend.17.weight'], bias=weights['frontend.17.bias'], padding=1)
        x = F.relu(x, inplace=True)
        x = F.conv2d(x, weights['frontend.19.weight'], bias=weights['frontend.19.bias'], padding=1)
        x = F.relu(x, inplace=True)
        x = F.conv2d(x, weights['frontend.21.weight'], bias=weights['frontend.21.bias'], padding=1)
        x = F.relu(x, inplace=True)

        # Backend
        x = F.conv2d(x, weights['backend.0.weight'], bias=weights['backend.0.bias'], padding=2, dilation=2)
        x = F.relu(x, inplace=True)
        x = F.conv2d(x, weights['backend.2.weight'], bias=weights['backend.2.bias'], padding=2, dilation=2)
        x = F.relu(x, inplace=True)
        x = F.conv2d(x, weights['backend.4.weight'], bias=weights['backend.4.bias'], padding=2, dilation=2)
        x = F.relu(x, inplace=True)
        x = F.conv2d(x, weights['backend.6.weight'], bias=weights['backend.6.bias'], padding=2, dilation=2)
        x = F.relu(x, inplace=True)
        x = F.conv2d(x, weights['backend.8.weight'], bias=weights['backend.8.bias'], padding=2, dilation=2)
        x = F.relu(x, inplace=True)
        x = F.conv2d(x, weights['backend.10.weight'], bias=weights['backend.10.bias'], padding=2, dilation=2)
        x = F.relu(x, inplace=True)

        # Output layer
        x = F.conv2d(x, weights['output_layer.weight'], bias=weights['output_layer.bias'])

        x = F.interpolate(x, scale_factor=8)

        return x
