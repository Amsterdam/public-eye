from eelib.ml_object_recognition.utils.garb_utils import process_result, load_images, resize_image, cv_image2tensor, transform_result, create_batches,create_output_json, load_data_frame
import math
import pickle as pkl
import os.path as osp
from datetime import datetime
from torch.autograd import Variable

import os
import argparse 
import torch
import logging

def detect_image(model, cuda, path, batch_size=1, obj_thresh = 0.5, nms_thresh = 0.4, colors=[(39, 129, 113), (164, 80, 133), (83, 122, 114)],classes=['container_small', 'garbage_bag', 'cardboard']):
    
    print('Loading input image(s)...')
    input_size = [416, 416]

    imlist, imgs = load_images(path)
    print('Input image(s) loaded')

    img_batches = create_batches(imgs, 1)

    print('Detecting...')

    all_images_attributes = []
    bboxes = []

    for batchi, img_batch in enumerate(img_batches):
        start_time = datetime.now()
        img_tensors = [cv_image2tensor(img, input_size) for img in img_batch]
        img_tensors = torch.stack(img_tensors)
        img_tensors = Variable(img_tensors)
        if cuda:
            img_tensors = img_tensors.cuda()

        detections, _ = model(img_tensors, cuda)
        detections = process_result(detections, obj_thresh, nms_thresh)

        if len(detections) == 0:
            bboxes.append([])
            continue

        detections = transform_result(detections, img_batch, input_size)

        boxes = []
        for detection in detections:
            boxes.append(create_output_json(img_batch, detection, colors, classes))

        bboxes.append(detections)

        images_attributes = {}
        images_attributes['frameMeta'] = {'width':input_size[1],'height':input_size[0]}
        images_attributes['detectedObjects'] = boxes

        images_attributes['counts'] = {x:0 for x in classes}
        images_attributes['counts']['total'] = 0
        
        for box in boxes:
            images_attributes['counts'][box['detectedObjectType']] +=1
            images_attributes['counts']['total'] +=1

        end_time = datetime.now()
        print('Detection finished in %s' % (end_time - start_time))
        images_attributes['mlDoneAt'] = str(end_time)
        images_attributes['mlTimeTaken'] = end_time - start_time

        all_images_attributes.append(images_attributes)

    return imlist, all_images_attributes, bboxes

def detect_image_2(model, cuda, imgs, batch_size=1, obj_thresh = 0.6, nms_thresh = 0.5, colors=[(39, 129, 113), (164, 80, 133), (83, 122, 114)],classes=['container_small', 'garbage_bag', 'cardboard']):
    input_size = [416, 416]
    batch_size = 1
    img_batches = create_batches(imgs, 1)
    all_images_attributes = []
    bboxes = []

    for batchi, img_batch in enumerate(img_batches):
        start_time = datetime.now()
        img_tensors = [cv_image2tensor(img, input_size) for img in img_batch]
        img_tensors = torch.stack(img_tensors)
        img_tensors = Variable(img_tensors)
        if cuda:
            img_tensors = img_tensors.cuda()

        detections, _ = model(img_tensors)
        detections = process_result(detections, obj_thresh, nms_thresh)

        if len(detections) == 0:
            continue

        detections = transform_result(detections, img_batch, input_size)
        bboxes.append(detections)

    return bboxes
  