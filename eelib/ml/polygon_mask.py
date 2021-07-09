import cv2
import numpy as np

def polygon_mask(image, polygons):
    height, width, _ = image.shape
    resized_polys = np.array([
        [
            [int(width * point[0]), int(height * point[1])]
             for point in poly]
        for poly in polygons
    ])
    mask = np.zeros((height, width))
    image_with_mask_lines = image.copy()

    for poly in resized_polys:
        poly = np.int32(np.array([poly]))
        cv2.fillPoly(mask, poly, 1)
        cv2.polylines(image_with_mask_lines, poly, 1, (57, 255, 20), 2)

    masked_image = np.uint8(np.multiply(image, np.expand_dims(mask, 2)))
    return np.uint8(image_with_mask_lines), masked_image, mask
