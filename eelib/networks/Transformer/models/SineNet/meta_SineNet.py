import torch
import numpy as np
from collections import OrderedDict


class MetaSineNet:
    """ A wrapper used for meta training SineNet. """
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
        """ Puts the models in training mode. """
        self.base_model.train()
        self.training = True

    def eval(self):
        """ Puts the models in evaluation mode. """
        self.base_model.eval()
        self.training = False

    def get_theta(self):
        """ The named parameters of the base model. """
        theta = OrderedDict((name, param) for name, param in self.base_model.named_parameters())
        return theta

    def get_params(self):
        return self.base_model.parameters()

    def train_forward(self, data, weights_dict):
        """ Used to train the model. """
        x, y = data
        x, y = x.cuda(), y.cuda()

        pred = self.functional_model.forward(x, weights_dict, training=self.training)
        loss = self.criterion(pred, y)

        avg_abs_error = torch.mean(torch.abs(pred.detach() - y))

        return loss, pred, avg_abs_error

    def test_forward(self, data, weights_dict=None):
        """ Used during model evaluation. """
        x, y = data
        x, y = x.squeeze(0).cuda(), y.squeeze(0).cuda()

        if weights_dict:
            pred = self.functional_model.forward(x, weights_dict, training=False)
        else:
            pred = self.base_model.forward(x)

        loss = self.criterion(pred, y)
        abs_error = torch.mean(torch.abs(pred.detach() - y))
        squared_error = torch.square(abs_error)

        return x, pred, y, loss, abs_error, squared_error
