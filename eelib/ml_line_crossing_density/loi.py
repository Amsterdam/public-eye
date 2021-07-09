import numpy as np
import torch
import math
import os
from scipy import misc, io

import scipy.misc
from scipy.ndimage import rotate
from scipy.ndimage.interpolation import zoom
import torchvision.transforms.functional as F
from PIL import Image, ImageDraw
from scipy.ndimage import rotate


# Give a region and turn it in a mask to extract the region information
def region_to_mask(region, rotate_angle, img_width, img_height):
    full_size = int(math.sqrt(math.pow(img_height, 2) + math.pow(img_width, 2)))
    center = (img_width / 2, img_height / 2)

    p1 = rotate_point(region[0], -rotate_angle, center)
    p2 = rotate_point(region[2], -rotate_angle, center)

    # Full size is the maximum size an image can get. (When an image is rotated 45 degrees it get's this size
    mask = np.zeros((full_size, full_size))

    fw = int((full_size - img_width)/2)
    fh = int((full_size - img_height)/2)

    # Add the region mask to the empty mask
    mask[fw + min(p1[0], p2[0]):fw + max(p1[0], p2[0]), fh + min(p1[1], p2[1]):fh + max(p1[1], p2[1])] = 1

    mask = rotate(mask, rotate_angle, reshape=False)
    mask = mask[fw:-fw, fh:-fh]
    mask = mask.transpose()
    return mask


# Rotate an individual point with a certain angle and a given centre
# In case of the LOI the centre is always the middle of the image
# A standard Linear Algebra trick
def rotate_point(point, angle, center, to_int=True):
    r_angle = math.radians(angle)
    r00 = math.cos(r_angle)
    r01 = -math.sin(r_angle)
    r10 = math.sin(r_angle)
    r11 = math.cos(r_angle)

    out = (
        r00 * point[0] + r01 * point[1] + center[0] - r00 * center[0] - r01 * center[1],
        r10 * point[0] + r11 * point[1] + center[1] - r10 * center[0] - r11 * center[1]
    )

    if to_int:
        out = int(out[0]), int(out[1])

    return out

def select_line_outer_points(regions, crop_distance, width, height):
    arr = np.asarray(np.array(regions, dtype=object)[:, :, :-1].flatten().tolist())
    min_x, max_x, min_y, max_y = np.min(arr[:, 0]), np.max(arr[:, 0]), \
                                 np.min(arr[:, 1]), np.max(arr[:, 1])

    if crop_distance is True:
        crop_distance = 0

    min_x = max(min_x-crop_distance, 0)
    max_x = min(max_x + crop_distance, width)
    min_y = max(min_y - crop_distance, 0)
    max_y = min(max_y + crop_distance, height)

    return min_x, max_x, min_y, max_y

# Fixed amount of regions
# Generate all the regions around the LOI (given by dot1 and dot2).
# A region is an array with all the cornerpoints and the with of the region
def select_regions_v1(dot1, dot2, width, regions):
    # Seperate the line into several parts with given start and end point.
    # Provide the corner points of the regions that lie on the LOI itself.
    height_region = width
    region_lines = []
    line_points = np.linspace(np.array(dot1), np.array(dot2), num=regions+1).astype(int)

    for i, point in enumerate(line_points):
        if i + 1 >= len(line_points):
            break

        point2 = line_points[i + 1]
        region_lines.append((tuple(list(point)),  tuple(list(point2))))

    region_lines.reverse()

    regions = ([], [])
    for point1, point2 in region_lines:

        # The difference which we can add to the region lines corners
        # to come to the corners on the other end of the region
        part_line_length = math.sqrt(math.pow(point1[0] - point2[0], 2) + math.pow(point1[1] - point2[1], 2))
        point_diff = (
            - (point1[1] - point2[1]) / float(part_line_length) * float(height_region),
            (point1[0] - point2[0]) / float(part_line_length) * float(height_region)
        )

        # Both add and substract the difference so we get the regions on both sides of the LOI.
        regions[0].append([
            point1,
            point2,
            (int(point2[0] + point_diff[0]), int(point2[1] + point_diff[1])),
            (int(point1[0] + point_diff[0]), int(point1[1] + point_diff[1])),
            height_region
        ])

        regions[1].append([
            point1,
            point2,
            (int(point2[0] - point_diff[0]), int(point2[1] - point_diff[1])),
            (int(point1[0] - point_diff[0]), int(point1[1] - point_diff[1])),
            height_region
        ])

    regions[0].reverse()
    regions[1].reverse()

    return regions

# To a fixed size of the region
def select_regions_v2(dot1, dot2, d_width, d_height):
    # Seperate the line into several parts with given start and end point.
    # Provide the corner points of the regions that lie on the LOI itself.

    # Swapped, because function variables fit better the thesis terminology
    height_region = d_width
    width_region = d_height

    line_length = math.sqrt(math.pow(dot1[0] - dot2[0], 2) + math.pow(dot1[1] - dot2[1], 2))
    a_regions = math.floor(line_length / width_region)
    side_perc = (1.0 - a_regions * width_region / line_length) / 2

    inner_points = list(np.linspace(side_perc, 1. - side_perc, num=a_regions + 1).astype(float))
    inner_points.insert(0, 0.0)
    inner_points.append(1.0)
    line_points = []
    for point_multi in inner_points:
        line_points.append((np.array(dot1) + point_multi * (np.array(dot2) - np.array(dot1))).astype(int))

    region_lines = []
    for i, point in enumerate(line_points):
        if i + 1 >= len(line_points):
            break

        point2 = line_points[i + 1]
        region_lines.append((tuple(list(point)), tuple(list(point2))))
    region_lines.reverse()

    regions = ([], [])
    for point1, point2 in region_lines:

        # The difference which we can add to the region lines corners
        # to come to the corners on the other end of the region
        part_line_length = math.sqrt(math.pow(point1[0] - point2[0], 2) + math.pow(point1[1] - point2[1], 2))
        if part_line_length == 0:
            continue

        point_diff = (
            - (point1[1] - point2[1]) / float(part_line_length) * float(height_region),
            (point1[0] - point2[0]) / float(part_line_length) * float(height_region)
        )

        # Both add and substract the difference so we get the regions on both sides of the LOI.
        regions[0].append([
            point1,
            point2,
            (int(point2[0] + point_diff[0]), int(point2[1] + point_diff[1])),
            (int(point1[0] + point_diff[0]), int(point1[1] + point_diff[1])),
            height_region
        ])

        regions[1].append([
            point1,
            point2,
            (int(point2[0] - point_diff[0]), int(point2[1] - point_diff[1])),
            (int(point1[0] - point_diff[0]), int(point1[1] - point_diff[1])),
            height_region
        ])

    regions[0].reverse()
    regions[1].reverse()

    return regions


class LOI_Calculator:
    def __init__(self, point1, point2, img_width, img_height, crop_processing=False,
                 loi_version='v1', loi_width=20, loi_height=20, loi_regions=6):
        self.point1 = point1
        self.point2 = point2
        self.img_width = img_width
        self.img_height = img_height

        self.center = (self.img_width / 2, self.img_height / 2)
        self.rotate_angle = math.degrees(math.atan((self.point2[1] - self.point1[1]) /
                                                   float(self.point2[0] - self.point1[0])))

        # self.select_type = 'V2'
        self.crop_processing = crop_processing
        self.crop_distance = 70

        self.regions = []
        self.masks = ([], [])

        self.loi_version = loi_version
        self.loi_height = loi_height
        self.loi_width = loi_width
        self.loi_regions = loi_regions
        self.distance_grid = None

    def create_regions(self):
        # Generate the original regions as well for later usage
        if self.loi_version == 'v1':
            self.regions = select_regions_v1(self.point1, self.point2, width=self.loi_width, regions=self.loi_regions)
        else:
            self.regions = select_regions_v2(self.point1, self.point2, d_width=self.loi_width, d_height=self.loi_height)

        self.masks = ([], [])
        for i, small_regions in enumerate(self.regions):
            for o, region in enumerate(small_regions):
                mask = region_to_mask(region, self.rotate_angle, img_width=self.img_width, img_height=self.img_height)
                self.masks[i].append(mask)

        self.distance_grid = self._generate_distance_grid()

        self.cropped_frame = select_line_outer_points(self.regions, self.crop_distance, self.img_width, self.img_height)

    def reshape_image(self, frame):
        if self.crop_processing is False:
            return frame

        frame = frame[:, :, self.cropped_frame[2]:self.cropped_frame[3], self.cropped_frame[0]:self.cropped_frame[1]]

        return frame


    def orig_sizes(self):
        if self.crop_processing is False:
            orig_height = self.img_height
            orig_width = self.img_width
        else:
            orig_height = self.cropped_frame[3] - self.cropped_frame[2]
            orig_width = self.cropped_frame[1] - self.cropped_frame[0]

        return orig_width, orig_height

    def to_orig_size(self, frame, rescale_values=True):
        orig_width, orig_height = self.orig_sizes()

        if frame.shape[2] == orig_height and frame.shape[3] == orig_width:
            return frame

        if rescale_values:
            factor = (orig_height * orig_width) / (frame.shape[2] * frame.shape[3])
        else:
            factor = 1.0
        frame = torch.nn.functional.interpolate(input=frame,
                                  size=(orig_height, orig_width),
                                  mode='bicubic', align_corners=False) / factor
        return frame

    def _generate_distance_grid(self):
        w = self.img_width
        h = self.img_height

        p1 = np.array(self.point1)
        p2 = np.array(self.point2)
        direction = p2 - p1

        x = np.tile(np.array(np.arange(0, w)), (h, 1)).T
        y = np.tile(np.array(np.arange(0, h)), (w, 1))
        xy = np.concatenate((x[:, :, None], y[:, :, None]), axis=2)

        line_points = xy - p1

        upper_proj = np.dot(line_points, direction)
        lower_proj = np.linalg.norm(direction) ** 2
        proj = upper_proj / lower_proj
        proj_points = proj[..., None] * np.tile(direction, (w, h, 1))

        return np.linalg.norm(proj_points - line_points, axis=2).T

    def regionwise_forward(self, counting_result, flow_result):
        if self.crop_processing is True:
            print("Regionwise is not optimized for cropping")
            exit()

        sums = ([], [])

        for i, side_regions in enumerate(self.regions):
            for o, region in enumerate(side_regions):
                mask = self.masks[i][o]

                # Get which part of the mask contains the actual mask
                # This massively improves the speed of the model
                points = np.array(region[0:4])

                # Get the crop for the regions
                min_x, max_x, min_y, max_y = np.min(points[:, 0]), np.max(points[:, 0]), \
                                             np.min(points[:, 1]), np.max(points[:, 1])

                lc_min_x, lc_max_x, lc_min_y, lc_max_y = min_x, max_x, min_y, max_y
                # Adjust the crop if we crop the prediction image as well
                # if self.crop_processing is False:
                #     lc_min_x, lc_max_x, lc_min_y, lc_max_y = min_x, max_x, min_y, max_y
                # else:
                #     adjust_x, _, adjust_y, _ = select_line_outer_points(self.regions, crop['crop'], crop['width'],
                #                                                         crop['height'])
                #     lc_min_x, lc_max_x, lc_min_y, lc_max_y = min_x - adjust_x, max_x - adjust_x, min_y - adjust_y, max_y - adjust_y

                cropped_mask = mask[min_y:max_y, min_x:max_x]

                # Use cropped mask on crowd counting result
                cc_part = cropped_mask * counting_result[lc_min_y:lc_max_y, lc_min_x:lc_max_x]

                # Project the flow estimation output on a line perpendicular to the LOI,
                # so we can calculate if the people are approach/leaving the LOI.
                direction = np.array([region[1][0] - region[2][0], region[1][1] - region[2][1]]).astype(
                    np.float32)
                direction = direction / np.linalg.norm(direction)

                # Crop so only cropped area gets projected
                part_flow_result = flow_result[lc_min_y:lc_max_y, lc_min_x:lc_max_x]

                # Project on direction of pedestrians
                perp = np.sum(np.multiply(part_flow_result, direction), axis=2)
                fe_part = cropped_mask * perp

                # Get all the movement towards the line
                threshold = 0.5
                towards_pixels = fe_part > threshold

                total_crowd = cc_part.sum()

                # Too remove some noise
                if towards_pixels.sum() == 0 or total_crowd < 0:
                    sums[i].append(0.0)
                    continue

                towards_avg = fe_part[towards_pixels].sum() / float(towards_pixels.sum())  # float(total_pixels)
                away_pixels = fe_part < -threshold

                # Calc percentage towards pixels in comparing tot total moving pixels
                total_moving_pixels = away_pixels.sum() + towards_pixels.sum()
                pixel_percentage_towards = towards_pixels.sum() / float(total_moving_pixels)
                crowd_towards = total_crowd * pixel_percentage_towards

                # Divide the average by the size of the region
                percentage_over = towards_avg / region[4]

                sums[i].append(crowd_towards * percentage_over)
        return sums

    def pixelwise_forward(self, counting_result, flow_result):
        sums = ([], [])

        for i, side_regions in enumerate(self.regions):
            for o, region in enumerate(side_regions):
                mask = self.masks[i][o]

                # Get which part of the mask contains the actual mask
                # This massively improves the speed of the model
                points = np.array(region[0:4])

                # Get the crop for the regions
                min_x, max_x, min_y, max_y = np.min(points[:, 0]), np.max(points[:, 0]), \
                                             np.min(points[:, 1]), np.max(points[:, 1])

                # lc_min_x, lc_max_x, lc_min_y, lc_max_y = min_x, max_x, min_y, max_y
                # Adjust the crop if we crop the prediction image as well
                if self.crop_processing is False:
                    lc_min_x, lc_max_x, lc_min_y, lc_max_y = min_x, max_x, min_y, max_y
                else:
                    adjust_x, _, adjust_y, _ = self.cropped_frame
                    lc_min_x, lc_max_x, lc_min_y, lc_max_y = min_x - adjust_x, max_x - adjust_x, min_y - adjust_y, max_y - adjust_y

                cropped_mask = mask[min_y:max_y, min_x:max_x]

                # Use cropped mask on crowd counting result
                cc_part = cropped_mask * counting_result[lc_min_y:lc_max_y, lc_min_x:lc_max_x]

                # Project the flow estimation output on a line perpendicular to the LOI,
                # so we can calculate if the people are approach/leaving the LOI.
                direction = np.array([region[1][0] - region[2][0], region[1][1] - region[2][1]]).astype(
                    np.float32)
                direction = direction / np.linalg.norm(direction)

                # Crop so only cropped area gets projected
                part_flow_result = flow_result[lc_min_y:lc_max_y, lc_min_x:lc_max_x]

                # Project on direction of pedestrians
                perp = np.sum(np.multiply(part_flow_result, direction), axis=2)
                fe_part = cropped_mask * perp

                # Get all the movement towards the line
                threshold = 0.5
                towards_pixels = fe_part > threshold

                # Too remove some noise
                if towards_pixels.sum() == 0 or cc_part.sum() < 0:
                    sums[i].append(0.0)
                    continue

                sums[i].append(np.multiply(fe_part[towards_pixels], cc_part[towards_pixels]).sum() / region[4])

        return sums

    def cross_pixelwise_forward(self, counting_result, flow_result):
        if self.crop_processing is True:
            print("Crossing is not optimized for cropping")
            exit()
            
        sums = ([], [])

        for i, side_regions in enumerate(self.regions):
            for o, region in enumerate(side_regions):
                mask = self.masks[i][o]

                # Get which part of the mask contains the actual mask
                # This massively improves the speed of the model
                points = np.array(region[0:4])

                # Get the crop for the regions
                min_x, max_x, min_y, max_y = np.min(points[:, 0]), np.max(points[:, 0]), \
                                             np.min(points[:, 1]), np.max(points[:, 1])

                lc_min_x, lc_max_x, lc_min_y, lc_max_y = min_x, max_x, min_y, max_y
                
                cropped_mask = mask[min_y:max_y, min_x:max_x]

                # Use cropped mask on crowd counting result
                cc_part = cropped_mask * counting_result[lc_min_y:lc_max_y, lc_min_x:lc_max_x]

                # Project the flow estimation output on a line perpendicular to the LOI,
                # so we can calculate if the people are approach/leaving the LOI.
                direction = np.array([region[1][0] - region[2][0], region[1][1] - region[2][1]]).astype(
                    np.float32)
                direction = direction / np.linalg.norm(direction)

                # Crop so only cropped area gets projected
                part_flow_result = flow_result[lc_min_y:lc_max_y, lc_min_x:lc_max_x]

                distance_grid_part = self.distance_grid[lc_min_y:lc_max_y, lc_min_x:lc_max_x]

                # Project on direction of pedestrians
                perp = np.sum(np.multiply(part_flow_result, direction), axis=2)
                fe_part = cropped_mask * perp

                # Get all the movement towards the line
                threshold = 0.5
                towards_pixels = fe_part > threshold

                # Too remove some noise
                if towards_pixels.sum() == 0 or cc_part.sum() < 0:
                    sums[i].append(0.0)
                    continue

                crossing_pixels = fe_part[towards_pixels] > distance_grid_part[towards_pixels]

                sums[i].append(cc_part[towards_pixels][crossing_pixels].sum())

        return sums
