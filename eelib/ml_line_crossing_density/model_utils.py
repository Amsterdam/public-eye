import torch

backwarp_tenGrid = {}
backwarp_tenPartial = {}

def backwarp(tenInput, tenFlow):
    if str(tenFlow.size()) not in backwarp_tenGrid:
        tenHorizontal = torch.linspace(-1.0, 1.0, tenFlow.shape[3]).view(1, 1, 1, tenFlow.shape[3]).expand(tenFlow.shape[0], -1, tenFlow.shape[2], -1)
        tenVertical = torch.linspace(-1.0, 1.0, tenFlow.shape[2]).view(1, 1, tenFlow.shape[2], 1).expand(tenFlow.shape[0], -1, -1, tenFlow.shape[3])

        backwarp_tenGrid[str(tenFlow.size())] = torch.cat([ tenHorizontal, tenVertical ], 1).cuda()
    # end

    if str(tenFlow.size()) not in backwarp_tenPartial:
        backwarp_tenPartial[str(tenFlow.size())] = tenFlow.new_ones([ tenFlow.shape[0], 1, tenFlow.shape[2], tenFlow.shape[3] ])
    # end

    tenFlow = torch.cat([ tenFlow[:, 0:1, :, :] / ((tenInput.shape[3] - 1.0) / 2.0), tenFlow[:, 1:2, :, :] / ((tenInput.shape[2] - 1.0) / 2.0) ], 1)
    tenInput = torch.cat([ tenInput, backwarp_tenPartial[str(tenFlow.size())] ], 1)

    tenOutput = torch.nn.functional.grid_sample(input=tenInput, grid=(backwarp_tenGrid[str(tenFlow.size())] + tenFlow).permute(0, 2, 3, 1), mode='bilinear', padding_mode='zeros', align_corners=True)

    tenMask = tenOutput[:, -1:, :, :]; tenMask[tenMask > 0.999] = 1.0; tenMask[tenMask < 1.0] = 0.0

    return tenOutput[:, :-1, :, :] * tenMask
# end

def length_sq(x):
    return torch.sum(torch.pow(x, 2), 1, keepdim=True)

def occlusion(flow_fw, flow_bw):
    flow_bw_warped = backwarp(flow_bw, flow_fw)
    flow_fw_warped = backwarp(flow_fw, flow_bw)
    flow_diff_fw = flow_fw + flow_bw_warped
    flow_diff_bw = flow_bw + flow_fw_warped
    mag_sq_fw = length_sq(flow_fw) + length_sq(flow_bw_warped)
    mag_sq_bw = length_sq(flow_bw) + length_sq(flow_fw_warped)
    occ_thresh_fw =  0.01 * mag_sq_fw + 0.5
    occ_thresh_bw =  0.01 * mag_sq_bw + 0.5
    occ_fw = length_sq(flow_diff_fw) > occ_thresh_fw
    occ_bw = length_sq(flow_diff_bw) > occ_thresh_bw
    occ_bw = occ_bw.type(torch.float)
    occ_fw = occ_fw.type(torch.float)

    return occ_fw, occ_bw