import torch.nn as nn
import torch

import os,sys,inspect
from .pwc import PWCNet
import torch.nn.functional as F

class DecoderCustomSmall(torch.nn.Module):
    def __init__(self, level, input_features, prev_features=0, output_features=-1):
        super().__init__()

        self.level = level
        self.input_features = input_features

        if output_features == -1:
            self.output_features = input_features
        else:
            self.output_features = output_features

        if level < 6: self.netUpfeat = torch.nn.ConvTranspose2d(in_channels=prev_features,
                                                                   out_channels=prev_features, kernel_size=4, stride=2, padding=1)
        if level < 6:
            begin_features = input_features + prev_features
        else:
            begin_features = input_features


        self.netOne = torch.nn.Sequential(
            torch.nn.Conv2d(in_channels=begin_features, out_channels=self.output_features, kernel_size=3, stride=1, padding=1, dilation=1),
            torch.nn.LeakyReLU(inplace=False, negative_slope=0.1)
        )

        self.netTwo = torch.nn.Sequential(
            torch.nn.Conv2d(in_channels=self.output_features, out_channels=self.output_features, kernel_size=3, stride=1,
                            padding=1, dilation=1),
            torch.nn.LeakyReLU(inplace=False, negative_slope=0.1)
        )
    # end

    def get_num_output_features(self):
        return self.output_features

    def forward(self, features, previous=None):
        if previous is None:
            tenFeat = features
        else:
            tenFeat = self.netUpfeat(previous['tenFeat'])

            tenFeat = torch.cat([features, tenFeat], 1)

        tenFeat = self.netOne(tenFeat)
        tenFeat = self.netTwo(tenFeat)

        return {
            'tenFeat': tenFeat
        }
    # end
# end

class RefinerCustom(torch.nn.Module):
    def __init__(self, input_features, layers_features = [128, 128, 128, 96, 64, 32]):
        super().__init__()

        self.netMain = torch.nn.Sequential(
            torch.nn.Conv2d(in_channels=input_features, out_channels=layers_features[0], kernel_size=3,
                            stride=1, padding=1, dilation=1),
            torch.nn.LeakyReLU(inplace=False, negative_slope=0.1),
            torch.nn.Conv2d(in_channels=layers_features[0], out_channels=layers_features[1], kernel_size=3, stride=1, padding=2, dilation=2),
            torch.nn.LeakyReLU(inplace=False, negative_slope=0.1),
            torch.nn.Conv2d(in_channels=layers_features[1], out_channels=layers_features[2], kernel_size=3, stride=1, padding=4, dilation=4),
            torch.nn.LeakyReLU(inplace=False, negative_slope=0.1),
            torch.nn.Conv2d(in_channels=layers_features[2], out_channels=layers_features[3], kernel_size=3, stride=1, padding=8, dilation=8),
            torch.nn.LeakyReLU(inplace=False, negative_slope=0.1),
            torch.nn.Conv2d(in_channels=layers_features[3], out_channels=layers_features[4], kernel_size=3, stride=1, padding=16, dilation=16),
            torch.nn.LeakyReLU(inplace=False, negative_slope=0.1),
            torch.nn.Conv2d(in_channels=layers_features[4], out_channels=layers_features[5], kernel_size=3, stride=1, padding=1, dilation=1),
            torch.nn.LeakyReLU(inplace=False, negative_slope=0.1),
            torch.nn.Conv2d(in_channels=layers_features[5], out_channels=1, kernel_size=3, stride=1, padding=1, dilation=1)
        )
    # end

    def forward(self, tenInput):
        return self.netMain(tenInput)
    # end
# end

class LOID2(torch.nn.Module):
    def __init__(self, load_pretrained=False):
        super().__init__()

        self.fe_net = PWCNet(flow_features=True)

        if load_pretrained == True:
            path = '../DDFlow_pytorch/network-chairs-things.pytorch'
            self.fe_net.load_state_dict({strKey.replace('module', 'net'): tenWeight for strKey, tenWeight in
                                         torch.load(path).items()})

        self.netSix = DecoderCustomSmall(6, input_features=196, output_features=196)
        self.netFiv = DecoderCustomSmall(5, input_features=128, output_features=128*2, prev_features=self.netSix.get_num_output_features())
        self.netFou = DecoderCustomSmall(4, input_features=96, output_features=96*2, prev_features=self.netFiv.get_num_output_features())
        self.netThr = DecoderCustomSmall(3, input_features=64, output_features=64*2, prev_features=self.netFou.get_num_output_features())

        self.netRefiner = RefinerCustom(self.netThr.get_num_output_features())

    def cc_forward(self, features1, features2, flow2, flow_features):
        objEstimate = self.netSix(features1[-1], None)
        objEstimate = self.netFiv(features1[-2], objEstimate)
        objEstimate = self.netFou(features1[-3], objEstimate)
        objEstimate = self.netThr(features1[-4], objEstimate)
        output = self.netRefiner(objEstimate['tenFeat'])

        if not self.training:
            output = F.relu(output)
        
        return output

    def forward(self, frame1, frame2):
        flow_fw, flow_bw, features1, features2, flow_features = self.fe_net.bidirection_forward(frame1, frame2, ret_features=True)
        density = self.cc_forward(features1, features2, flow_fw, flow_features)
        return flow_fw, flow_bw, density



class LOID(torch.nn.Module):
    def __init__(self, load_pretrained=False):
        super().__init__()

        self.fe_net = PWCNet(flow_features=True)

        if load_pretrained == True:
            path = '../DDFlow_pytorch/network-chairs-things.pytorch'
            self.fe_net.load_state_dict({strKey.replace('module', 'net'): tenWeight for strKey, tenWeight in
                                         torch.load(path).items()})

        self.netSix = DecoderCustomSmall(6, input_features=196, output_features=196)
        self.netFiv = DecoderCustomSmall(5, input_features=128, output_features=128*2, prev_features=self.netSix.get_num_output_features())
        self.netFou = DecoderCustomSmall(4, input_features=96, output_features=96*2, prev_features=self.netFiv.get_num_output_features())
        self.netThr = DecoderCustomSmall(3, input_features=64, output_features=64*2, prev_features=self.netFou.get_num_output_features())
        self.netTwo = DecoderCustomSmall(3, input_features=32, output_features=64*2, prev_features=self.netThr.get_num_output_features())

        self.netRefiner = RefinerCustom(self.netTwo.get_num_output_features())

    def cc_forward(self, features1, features2, flow2, flow_features):
        objEstimate = self.netSix(features1[-1], None)
        objEstimate = self.netFiv(features1[-2], objEstimate)
        objEstimate = self.netFou(features1[-3], objEstimate)
        objEstimate = self.netThr(features1[-4], objEstimate)
        objEstimate = self.netTwo(features1[-5], objEstimate)
        output = self.netRefiner(objEstimate['tenFeat'])

        if not self.training:
            output = F.relu(output)
        
        return output

    def forward(self, frame1, frame2):
        flow_fw, flow_bw, features1, features2, flow_features = self.fe_net.bidirection_forward(frame1, frame2, ret_features=True)
        density = self.cc_forward(features1, features2, flow_fw, flow_features)
        return flow_fw, flow_bw, density


class LOID2(torch.nn.Module):
    def __init__(self, load_pretrained=False):
        super().__init__()

        self.fe_net = PWCNet(flow_features=True)

        if load_pretrained == True:
            path = '../DDFlow_pytorch/network-chairs-things.pytorch'
            self.fe_net.load_state_dict({strKey.replace('module', 'net'): tenWeight for strKey, tenWeight in
                                         torch.load(path).items()})

        self.netSix = DecoderCustomSmall(6, input_features=196, output_features=196)
        self.netFiv = DecoderCustomSmall(5, input_features=128, output_features=128*2, prev_features=self.netSix.get_num_output_features())
        self.netFou = DecoderCustomSmall(4, input_features=96, output_features=96*2, prev_features=self.netFiv.get_num_output_features())
        self.netThr = DecoderCustomSmall(3, input_features=64, output_features=64*2, prev_features=self.netFou.get_num_output_features())

        self.netRefiner = RefinerCustom(self.netThr.get_num_output_features())

    def cc_forward(self, features1, features2, flow2, flow_features):
        objEstimate = self.netSix(features1[-1], None)
        objEstimate = self.netFiv(features1[-2], objEstimate)
        objEstimate = self.netFou(features1[-3], objEstimate)
        objEstimate = self.netThr(features1[-4], objEstimate)
        output = self.netRefiner(objEstimate['tenFeat'])

        if not self.training:
            output = F.relu(output)
        
        return output

    def forward(self, frame1, frame2):
        flow_fw, flow_bw, features1, features2, flow_features = self.fe_net.bidirection_forward(frame1, frame2, ret_features=True)
        density = self.cc_forward(features1, features2, flow_fw, flow_features)
        return flow_fw, flow_bw, density