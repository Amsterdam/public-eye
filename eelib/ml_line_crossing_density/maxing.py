import numpy as np
import torch
import math

#### Smooth the surroundings for Flow Estimation ####
# Due to the use of 2D conv to do one sample at the time which is easy
# Update could handle multiple frames at the time
#
# Surrounding: Pixels around each pixel to look for the max
# only_under removes the search in top side of the pixel
# Smaller_sides: When only_under the width search will be as wide as the height (surrounding+1)
def get_max_surrounding(data, surrounding=1, only_under=True, smaller_sides=True):
    kernel_size = surrounding * 2 + 1
    out_channels = np.eye(kernel_size * kernel_size)

    if only_under:
        out_channels = out_channels[surrounding * kernel_size:]
        if smaller_sides:
            for i in range(math.floor(surrounding/2)):
                out_channels[list(range(i, len(out_channels), kernel_size))] = False
                out_channels[list(range(kernel_size - i - 1, len(out_channels), kernel_size))] = False

    w = out_channels.reshape((out_channels.shape[0], 1, kernel_size, kernel_size))
    w = torch.tensor(w, dtype=torch.float).cuda()

    data = data.transpose(0, 1).cuda()
    patches = torch.nn.functional.conv2d(data, w, padding=(surrounding, surrounding))[:, :, :data.shape[2], :data.shape[3]]

    speed = torch.sqrt(torch.sum(torch.pow(patches, 2), axis=0))
    max_speeds = torch.argmax(speed, axis=0)
    gather_speeds = max_speeds.unsqueeze(0).unsqueeze(0).repeat(2, 1, 1, 1)
    output = torch.gather(patches, 1, gather_speeds)
    output = output.transpose(0, 1)

    return output