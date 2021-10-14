import torch
import numpy as np
from collections import OrderedDict


class MetaCSRNet:
    def __init__(self, base_model, functional_model, criterion):
        self.base_model = base_model
        self.functional_model = functional_model
        self.criterion = criterion
        self.training = None

    def disable_alpha_updates(self):
        self.base_model.alpha.requires_grad_(False)

    def enable_alpha_updates(self):
        self.base_model.alpha.requires_grad_(True)

    def train(self):
        self.base_model.train()
        self.training = True

    def eval(self):
        self.base_model.eval()
        self.training = False

    def get_theta(self):
        theta = OrderedDict((name, param) for name, param in self.base_model.named_parameters())
        return theta

    def get_params(self):
        return self.base_model.parameters()

    def train_forward(self, data, weights_dict):
        img, gt = data
        img, gt = img.cuda(), gt.squeeze().cuda()

        pred = self.functional_model.forward(img, weights_dict, training=self.training)
        pred = pred.squeeze()
        loss = self.criterion(pred, gt)

        avg_abs_error = torch.mean(torch.abs(torch.sum(pred.detach() - gt, dim=(-2, -1))))

        return loss, pred, avg_abs_error

    def test_forward(self, data, weights_dict=None):
        img, gt = data
        img, gt = img.cuda(), gt.squeeze().cuda()

        if weights_dict:
            pred = self.functional_model.forward(img, weights_dict, training=False)
        else:
            pred = self.base_model.forward(img)
        pred = pred.squeeze()

        loss = self.criterion(pred, gt)
        abs_error = torch.abs(torch.sum(pred.detach() - gt, dim=(-2, -1)))
        squared_error = torch.square(abs_error)

        return img, pred, gt, loss, abs_error, squared_error

