import torch.nn as nn
import torch
import torch.nn.functional as F
import sys
import os
from eelib.ml_line_crossing_density.model_pwcnet import Extractor, PWCNet
from eelib.ml_line_crossing_density.model_utils import backwarp

import math

from eelib.ml_line_crossing_density.correlation import correlation # the custom cost volume layer

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
# end

########################################
#### BASELINE21 represents Zhao 2016 ###
########################################
class Baseline21(torch.nn.Module):
    def __init__(self, load_pretrained=True):
        super().__init__()

        self.fe_net = PWCNet(flow_features=True)

        if load_pretrained == True:
            path = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'models', 'network-chairs-things.pytorch')
            self.fe_net.load_state_dict({strKey.replace('module', 'net'): tenWeight for strKey, tenWeight in
                                         torch.load(path).items()})

        # Layer 3
        self.flow_layer3 = nn.Sequential(
            nn.Conv2d(in_channels=597, out_channels=1, kernel_size=3, stride=1,
                      padding=1)
        )

    def cc_forward(self, features1, features2, flow2, flow_features):
        features = features1
        ret3 = F.interpolate(input=self.flow_layer3(flow_features[3]), size=(features[2].shape[2], features[2].shape[3]),
                             mode='bilinear', align_corners=False)

        # Add here the model after context module??

        ret = ret3
        return ret

    def forward(self, frame1, frame2):
        flow_fw, flow_bw, features1, features2, flow_features = self.fe_net.bidirection_forward(frame1, frame2, ret_features=True)
        density = self.cc_forward(features1, features2, flow_fw, flow_features)
        return flow_fw, flow_bw, density

#################################
### SINGLE IMAGE SMALLER OUTPUT #
#################################
class P2Small(torch.nn.Module):
    def __init__(self, load_pretrained=True):
        super().__init__()

        self.fe_net = PWCNet(flow_features=True)

        if load_pretrained == True:
            path = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'models', 'network-chairs-things.pytorch')
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

##########################################
#### WITH SINGLE FRAME AS PREDICTOR ######
##########################################
class P21Small(torch.nn.Module):
    def __init__(self, load_pretrained=True):
        super().__init__()

        self.fe_net = PWCNet(flow_features=True)

        if load_pretrained == True:
            path = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'models', 'network-chairs-things.pytorch')
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

##################################
#### SECOND IMAGE AS CONTEXT #####
##################################
class P33Small(torch.nn.Module):
    def __init__(self, load_pretrained=True):
        super().__init__()

        self.fe_net = PWCNet(flow_features=True)

        if load_pretrained == True:
            path = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'models', 'network-chairs-things.pytorch')
            self.fe_net.load_state_dict({strKey.replace('module', 'net'): tenWeight for strKey, tenWeight in
                                         torch.load(path).items()})

        self.netSix = DecoderCustomSmall(6, input_features=196*2, output_features=196*2)
        self.netFiv = DecoderCustomSmall(5, input_features=128*2, output_features=128*2*2, prev_features=self.netSix.get_num_output_features())
        self.netFou = DecoderCustomSmall(4, input_features=96*2, output_features=96*2*2, prev_features=self.netFiv.get_num_output_features())
        self.netThr = DecoderCustomSmall(3, input_features=64*2, output_features=64*2*2, prev_features=self.netFou.get_num_output_features())
        self.netTwo = DecoderCustomSmall(3, input_features=32*2, output_features=64*2*2, prev_features=self.netThr.get_num_output_features())

        self.netSix2 = DecoderCustomSmall(6, input_features=196, output_features=196)
        self.netFiv2 = DecoderCustomSmall(5, input_features=128, output_features=128, prev_features=self.netSix2.get_num_output_features())
        self.netFou2 = DecoderCustomSmall(4, input_features=96, output_features=96, prev_features=self.netFiv2.get_num_output_features())
        self.netThr2 = DecoderCustomSmall(3, input_features=64, output_features=64, prev_features=self.netFou2.get_num_output_features())
        self.netTwo2 = DecoderCustomSmall(3, input_features=32, output_features=32, prev_features=self.netThr2.get_num_output_features())

        self.netRefiner = RefinerCustom(self.netTwo.get_num_output_features())

    def cc_forward(self, features1, features2, flow2, flow_features):
        objEstimate2 = self.netSix2(features2[-1], None)
        objEstimate = self.netSix(torch.cat([features1[-1], objEstimate2['tenFeat']], 1), None)

        objEstimate2 = self.netFiv2(features2[-2], objEstimate2)
        objEstimate = self.netFiv(torch.cat([features1[-2], objEstimate2['tenFeat']], 1), objEstimate)

        objEstimate2 = self.netFou2(features2[-3], objEstimate2)
        objEstimate = self.netFou(torch.cat([features1[-3], objEstimate2['tenFeat']], 1), objEstimate)

        objEstimate2 = self.netThr2(features2[-4], objEstimate2)
        objEstimate = self.netThr(torch.cat([features1[-4], objEstimate2['tenFeat']], 1), objEstimate)

        objEstimate2 = self.netTwo2(features2[-5], objEstimate2)
        objEstimate = self.netTwo(torch.cat([features1[-5], objEstimate2['tenFeat']], 1), objEstimate)

        output = self.netRefiner(objEstimate['tenFeat'])

        if not self.training:
            output = F.relu(output)
        
        return output

    def forward(self, frame1, frame2):
        flow_fw, flow_bw, features1, features2, flow_features = self.fe_net.bidirection_forward(frame1, frame2, ret_features=True)
        density = self.cc_forward(features1, features2, flow_fw, flow_features)
        return flow_fw, flow_bw, density

##########################################
#### ADDING DIRECT FLOW AS CONTEXT #######
##########################################
class P43Small(torch.nn.Module):
    def __init__(self, load_pretrained=True):
        super().__init__()

        self.fe_net = PWCNet(flow_features=True)

        if load_pretrained == True:
            path = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'models', 'network-chairs-things.pytorch')
            self.fe_net.load_state_dict({strKey.replace('module', 'net'): tenWeight for strKey, tenWeight in
                                         torch.load(path).items()})

        self.netSix = DecoderCustomSmall(6, input_features=196*2, output_features=196*2)
        self.netFiv = DecoderCustomSmall(5, input_features=128*2, output_features=128*2*2, prev_features=self.netSix.get_num_output_features())
        self.netFou = DecoderCustomSmall(4, input_features=96*2, output_features=96*2*2, prev_features=self.netFiv.get_num_output_features())
        self.netThr = DecoderCustomSmall(3, input_features=64*2, output_features=64*2*2, prev_features=self.netFou.get_num_output_features())
        self.netTwo = DecoderCustomSmall(3, input_features=32*2, output_features=64*2*2, prev_features=self.netThr.get_num_output_features())

        self.netSix2 = DecoderCustomSmall(6, input_features=196, output_features=196)
        self.netFiv2 = DecoderCustomSmall(5, input_features=128, output_features=128, prev_features=self.netSix2.get_num_output_features())
        self.netFou2 = DecoderCustomSmall(4, input_features=96, output_features=96, prev_features=self.netFiv2.get_num_output_features())
        self.netThr2 = DecoderCustomSmall(3, input_features=64, output_features=64, prev_features=self.netFou2.get_num_output_features())
        self.netTwo2 = DecoderCustomSmall(3, input_features=32, output_features=32, prev_features=self.netThr2.get_num_output_features())

        self.flowReduceSix = torch.nn.Conv2d(in_channels=529, out_channels=196, kernel_size=3, padding=1)
        self.flowReduceFiv = torch.nn.Conv2d(in_channels=661, out_channels=128, kernel_size=3, padding=1)
        self.flowReduceFou = torch.nn.Conv2d(in_channels=629, out_channels=96, kernel_size=3, padding=1)
        self.flowReduceThr = torch.nn.Conv2d(in_channels=597, out_channels=64, kernel_size=3, padding=1)
        self.flowReduceTwo = torch.nn.Conv2d(in_channels=565, out_channels=32, kernel_size=3, padding=1)

        self.netRefiner = RefinerCustom(self.netTwo.get_num_output_features())

    def cc_forward(self, features1, features2, flow2, flow_features):
        objEstimate2 = self.netSix2(self.flowReduceSix(flow_features[0]), None)
        objEstimate = self.netSix(torch.cat([features1[-1], objEstimate2['tenFeat']], 1), None)

        objEstimate2 = self.netFiv2(self.flowReduceFiv(flow_features[1]), objEstimate2)
        objEstimate = self.netFiv(torch.cat([features1[-2], objEstimate2['tenFeat']], 1), objEstimate)

        objEstimate2 = self.netFou2(self.flowReduceFou(flow_features[2]), objEstimate2)
        objEstimate = self.netFou(torch.cat([features1[-3], objEstimate2['tenFeat']], 1), objEstimate)

        objEstimate2 = self.netThr2(self.flowReduceThr(flow_features[3]), objEstimate2)
        objEstimate = self.netThr(torch.cat([features1[-4], objEstimate2['tenFeat']], 1), objEstimate)

        objEstimate2 = self.netTwo2(self.flowReduceTwo(flow_features[4]), objEstimate2)
        objEstimate = self.netTwo(torch.cat([features1[-5], objEstimate2['tenFeat']], 1), objEstimate)

        output = self.netRefiner(objEstimate['tenFeat'])

        if not self.training:
            output = F.relu(output)
        
        return output

    def forward(self, frame1, frame2):
        flow_fw, flow_bw, features1, features2, flow_features = self.fe_net.bidirection_forward(frame1, frame2, ret_features=True)
        density = self.cc_forward(features1, features2, flow_fw, flow_features)
        return flow_fw, flow_bw, density

#############################
### WARPING ON Features 2 ###
#############################
class P632Small(torch.nn.Module):
    def __init__(self, load_pretrained=True):
        super().__init__()

        self.fe_net = PWCNet(flow_features=True)

        if load_pretrained == True:
            path = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'models', 'network-chairs-things.pytorch')
            self.fe_net.load_state_dict({strKey.replace('module', 'net'): tenWeight for strKey, tenWeight in
                                         torch.load(path).items()})

        self.netSix = DecoderCustomSmall(6, input_features=196*2, output_features=196*2)
        self.netFiv = DecoderCustomSmall(5, input_features=128*2, output_features=128*2*2, prev_features=self.netSix.get_num_output_features())
        self.netFou = DecoderCustomSmall(4, input_features=96*2, output_features=96*2*2, prev_features=self.netFiv.get_num_output_features())
        self.netThr = DecoderCustomSmall(3, input_features=64*2, output_features=64*2*2, prev_features=self.netFou.get_num_output_features())
        self.netTwo = DecoderCustomSmall(3, input_features=32*2, output_features=64*2*2, prev_features=self.netThr.get_num_output_features())

        self.netSix2 = DecoderCustomSmall(6, input_features=196, output_features=196)
        self.netFiv2 = DecoderCustomSmall(5, input_features=128, output_features=128, prev_features=self.netSix2.get_num_output_features())
        self.netFou2 = DecoderCustomSmall(4, input_features=96, output_features=96, prev_features=self.netFiv2.get_num_output_features())
        self.netThr2 = DecoderCustomSmall(3, input_features=64, output_features=64, prev_features=self.netFou2.get_num_output_features())
        self.netTwo2 = DecoderCustomSmall(3, input_features=32, output_features=32, prev_features=self.netThr2.get_num_output_features())

        self.flowReduceSix = torch.nn.Conv2d(in_channels=529, out_channels=2, kernel_size=3, padding=1)
        self.flowReduceFiv = torch.nn.Conv2d(in_channels=661, out_channels=2, kernel_size=3, padding=1)
        self.flowReduceFou = torch.nn.Conv2d(in_channels=629, out_channels=2, kernel_size=3, padding=1)
        self.flowReduceThr = torch.nn.Conv2d(in_channels=597, out_channels=2, kernel_size=3, padding=1)
        self.flowReduceTwo = torch.nn.Conv2d(in_channels=565, out_channels=2, kernel_size=3, padding=1)

        self.netRefiner = RefinerCustom(self.netTwo.get_num_output_features())
        self.netRefiner2 = RefinerCustom(self.netTwo2.get_num_output_features())

    def cc_forward(self, features1, features2, flow2, flow_features):
        objEstimate2 = self.netSix2(features2[-1], None)
        back = backwarp(tenInput=objEstimate2['tenFeat'], tenFlow=self.flowReduceSix(flow_features[0]))
        objEstimate = self.netSix(torch.cat([features1[-1], back], 1), None)

        objEstimate2 = self.netFiv2(features2[-2], objEstimate2)
        back = backwarp(tenInput=objEstimate2['tenFeat'], tenFlow=self.flowReduceFiv(flow_features[1]))
        objEstimate = self.netFiv(torch.cat([features1[-2], back], 1), objEstimate)

        objEstimate2 = self.netFou2(features2[-3], objEstimate2)
        back = backwarp(tenInput=objEstimate2['tenFeat'], tenFlow=self.flowReduceFou(flow_features[2]))
        objEstimate = self.netFou(torch.cat([features1[-3], back], 1), objEstimate)

        objEstimate2 = self.netThr2(features2[-4], objEstimate2)
        back = backwarp(tenInput=objEstimate2['tenFeat'], tenFlow=self.flowReduceThr(flow_features[3]))
        objEstimate = self.netThr(torch.cat([features1[-4], back], 1), objEstimate)

        objEstimate2 = self.netTwo2(features2[-5], objEstimate2)
        back = backwarp(tenInput=objEstimate2['tenFeat'], tenFlow=self.flowReduceTwo(flow_features[4]))
        objEstimate = self.netTwo(torch.cat([features1[-5], back], 1), objEstimate)

        output = self.netRefiner(objEstimate['tenFeat'])

        if not self.training:
            output = F.relu(output)
        else:
            output = torch.cat([output, self.netRefiner2(objEstimate2['tenFeat'])], 1)
        
        return output

    def forward(self, frame1, frame2):
        flow_fw, flow_bw, features1, features2, flow_features = self.fe_net.bidirection_forward(frame1, frame2, ret_features=True)
        density = self.cc_forward(features1, features2, flow_fw, flow_features)
        return flow_fw, flow_bw, density

class P72Small(torch.nn.Module):
    def __init__(self, load_pretrained=True):
        super().__init__()

        self.fe_net = PWCNet(flow_features=True)

        if load_pretrained == True:
            path = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'models', 'network-chairs-things.pytorch')
            self.fe_net.load_state_dict({strKey.replace('module', 'net'): tenWeight for strKey, tenWeight in
                                         torch.load(path).items()})

        self.netSix = DecoderCustomSmall(6, input_features=196*3, output_features=196*2)
        self.netFiv = DecoderCustomSmall(5, input_features=128*3, output_features=128*2*2, prev_features=self.netSix.get_num_output_features())
        self.netFou = DecoderCustomSmall(4, input_features=96*3, output_features=96*2*2, prev_features=self.netFiv.get_num_output_features())
        self.netThr = DecoderCustomSmall(3, input_features=64*3, output_features=64*2*2, prev_features=self.netFou.get_num_output_features())
        self.netTwo = DecoderCustomSmall(3, input_features=32*3, output_features=64*2*2, prev_features=self.netThr.get_num_output_features())

        self.netSix2 = DecoderCustomSmall(6, input_features=196, output_features=196)
        self.netFiv2 = DecoderCustomSmall(5, input_features=128, output_features=128, prev_features=self.netSix2.get_num_output_features())
        self.netFou2 = DecoderCustomSmall(4, input_features=96, output_features=96, prev_features=self.netFiv2.get_num_output_features())
        self.netThr2 = DecoderCustomSmall(3, input_features=64, output_features=64, prev_features=self.netFou2.get_num_output_features())
        self.netTwo2 = DecoderCustomSmall(3, input_features=32, output_features=32, prev_features=self.netThr2.get_num_output_features())

        self.flowReduceSix = torch.nn.Conv2d(in_channels=529, out_channels=2, kernel_size=3, padding=1)
        self.flowReduceFiv = torch.nn.Conv2d(in_channels=661, out_channels=2, kernel_size=3, padding=1)
        self.flowReduceFou = torch.nn.Conv2d(in_channels=629, out_channels=2, kernel_size=3, padding=1)
        self.flowReduceThr = torch.nn.Conv2d(in_channels=597, out_channels=2, kernel_size=3, padding=1)
        self.flowReduceTwo = torch.nn.Conv2d(in_channels=565, out_channels=2, kernel_size=3, padding=1)

        self.flowReduceSix2 = torch.nn.Conv2d(in_channels=529, out_channels=196, kernel_size=3, padding=1)
        self.flowReduceFiv2 = torch.nn.Conv2d(in_channels=661, out_channels=128, kernel_size=3, padding=1)
        self.flowReduceFou2 = torch.nn.Conv2d(in_channels=629, out_channels=96, kernel_size=3, padding=1)
        self.flowReduceThr2 = torch.nn.Conv2d(in_channels=597, out_channels=64, kernel_size=3, padding=1)
        self.flowReduceTwo2 = torch.nn.Conv2d(in_channels=565, out_channels=32, kernel_size=3, padding=1)

        self.netRefiner = RefinerCustom(self.netTwo.get_num_output_features())
        self.netRefiner2 = RefinerCustom(self.netTwo2.get_num_output_features())

    def cc_forward(self, features1, features2, flow2, flow_features):
        objEstimate2 = self.netSix2(features2[-1], None)
        back = backwarp(tenInput=objEstimate2['tenFeat'], tenFlow=self.flowReduceSix(flow_features[0]))
        objEstimate = self.netSix(torch.cat([features1[-1], back, self.flowReduceSix2(flow_features[0])], 1), None)

        objEstimate2 = self.netFiv2(features2[-2], objEstimate2)
        back = backwarp(tenInput=objEstimate2['tenFeat'], tenFlow=self.flowReduceFiv(flow_features[1]))
        objEstimate = self.netFiv(torch.cat([features1[-2], back, self.flowReduceFiv2(flow_features[1])], 1), objEstimate)

        objEstimate2 = self.netFou2(features2[-3], objEstimate2)
        back = backwarp(tenInput=objEstimate2['tenFeat'], tenFlow=self.flowReduceFou(flow_features[2]))
        objEstimate = self.netFou(torch.cat([features1[-3], back, self.flowReduceFou2(flow_features[2])], 1), objEstimate)

        objEstimate2 = self.netThr2(features2[-4], objEstimate2)
        back = backwarp(tenInput=objEstimate2['tenFeat'], tenFlow=self.flowReduceThr(flow_features[3]))
        objEstimate = self.netThr(torch.cat([features1[-4], back, self.flowReduceThr2(flow_features[3])], 1), objEstimate)

        objEstimate2 = self.netTwo2(features2[-5], objEstimate2)
        back = backwarp(tenInput=objEstimate2['tenFeat'], tenFlow=self.flowReduceTwo(flow_features[4]))
        objEstimate = self.netTwo(torch.cat([features1[-5], back, self.flowReduceTwo2(flow_features[4])], 1), objEstimate)

        output = self.netRefiner(objEstimate['tenFeat'])

        if not self.training:
            output = F.relu(output)
        else:
            output = torch.cat([output, self.netRefiner2(objEstimate2['tenFeat'])], 1)
        
        return output

    def forward(self, frame1, frame2):
        flow_fw, flow_bw, features1, features2, flow_features = self.fe_net.bidirection_forward(frame1, frame2, ret_features=True)
        density = self.cc_forward(features1, features2, flow_fw, flow_features)
        return flow_fw, flow_bw, density