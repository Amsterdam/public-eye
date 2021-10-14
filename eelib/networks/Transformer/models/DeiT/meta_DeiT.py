import torch
import numpy as np
from collections import OrderedDict
from eelib.ml_transformer.datasets.dataset_utils import img_equal_unsplit


class MetaDeiT:
    def __init__(self, base_model, functional_model, criterion, cfg_data):
        self.base_model = base_model
        self.functional_model = functional_model
        self.criterion = criterion
        self.training = None
        self.cfg_data = cfg_data

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
        img_stack, gt_stack = data
        img_stack, gt_stack = img_stack.squeeze(0).cuda(), gt_stack.squeeze(0).cuda()

        pred = self.functional_model.forward(img_stack, weights_dict, training=self.training)
        loss = self.criterion(pred, gt_stack)

        avg_abs_error = torch.mean(torch.abs(torch.sum(pred.detach() - gt_stack, dim=(-2, -1))))

        return loss, pred, avg_abs_error

    def test_forward(self, data, weights_dict=None):
        img, img_stack, gt_stack = data
        img_stack, gt_stack = img_stack.squeeze(0).cuda(), gt_stack.squeeze(0).cuda()
        img_h, img_w = img.shape[-2:]

        if weights_dict:
            pred = self.functional_model.forward(img_stack, weights_dict, training=False)
        else:
            pred = self.base_model.forward(img_stack)
        loss = self.criterion(pred, gt_stack)

        gt = img_equal_unsplit(gt_stack.cpu(), self.cfg_data.OVERLAP, self.cfg_data.IGNORE_BUFFER, img_h, img_w, 1)
        pred_den = img_equal_unsplit(pred.cpu(), self.cfg_data.OVERLAP, self.cfg_data.IGNORE_BUFFER, img_h, img_w, 1)

        abs_error = torch.abs(torch.sum(pred_den.detach() - gt, dim=(-2, -1)))
        squared_error = torch.square(abs_error)

        return img, pred, gt, loss, abs_error, squared_error
