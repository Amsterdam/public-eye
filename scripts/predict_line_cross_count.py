import cv2
import os
from eelib.networks.registry import NNRegistry as ModelRegistry
from eelib.ml_object_recognition.detect_image import detect_image_2
from eelib.ml_tracking.sort import Sort
import numpy as np
import matplotlib.pyplot as plt
import eelib.store as store
import matplotlib
import torch
import argparse
import sys
import eelib.postgres as pg
from eelib.stream.stream_utils import draw_bbox

pg.connect()

class Point:
    def __init__(self, y, x):
        self.x, self.y = x, y

def cross_product(a, b, c):
    # ((b.X - a.X)*(c.Y - a.Y) - (b.Y - a.Y)*(c.X - a.X))
    return (
        ((b.x - a.x) * (c.y - a.y)) -
        ((b.y - a.y) * (c.x - a.x))
    )

def different_side(cross_product1, cross_product2):
    if cross_product1 < 0 and cross_product2 > 0:
        return (True, 'back')
    if cross_product1 > 0 and cross_product2 < 0:
        return (True, 'front')
    return (False, None)

    
def get_mid_bottom(p1, p2):
    x = ((p2[1] - p1[0]) / 2) + p1[0]
    y = p2[1]
    return Point(y, x)

def draw_bbox(img, uid, p1, p2, cls_ind, to_close = False):
    if cls_ind != 0:
        return img

    label = 'person'
    confidence = int(float(1)*100)
    label = label+' '+str(uid)+'%'

    color = (122, 122, 45)
    if to_close:
        color = (0, 0, 255)

    cv2.rectangle(img, p1, p2, color, 4)

    text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 1, 1)[0]
    p3 = (p1[0], p1[1] - text_size[1] - 4)
    p4 = (p1[0] + text_size[0] + 4, p1[1])

    cv2.rectangle(img, p3, p4, color, -1)

    cv2.putText(img, label, p1, cv2.FONT_HERSHEY_SIMPLEX, 1, [225, 255, 255], 1)
    return img

def parse_video_line_crossing_count(
    batch_size,
    yolo_network,
    path,
    linepoint1,
    linepoint2,
    output_filename,
    captured_frames,
    debug,
    start_time_stamp,
    skip_at_start,
    crossed_count_back,
    crossed_count_front):

    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frames_per_minute = int(fps * 60)

    skip_frames_at_start = int(fps * skip_at_start)
    skip_frames = 1
    previous_map = {}
    crossed_already = set()
    mot_tracker = Sort(min_hits=3, max_age=100)
    
    
    timestamp = start_time_stamp

    # this is used for batches
    # accumalate frames until batch size
    # then serve prediction as if they came frame by frame
    def detections_generator():
        batch = []
        while cap.isOpened():
            read, frame = cap.read()
            if not read:
                return

            batch.append(frame)
            if len(batch) == batch_size:
                detections = detect_image_2(
                    yolo_network, cuda, batch, batch_size=batch_size, obj_thresh = 0.5, nms_thresh = 0.3)

                for d, f in zip(detections, batch):
                    yield d, f
                
                batch = []


    for detection, frame in detections_generator():
        print('captured frame', captured_frames)
        if captured_frames < skip_frames_at_start:
            captured_frames += 1
            continue

        if ((captured_frames - skip_frames_at_start) % frames_per_minute == 0 and
           (captured_frames - skip_frames_at_start) != 0):

            if debug:
                plt.imshow(frame)
                plt.show()

            if output_filename:
                with open(output_filename, 'a') as f:
                    f.write('\n{},{},{}'.format(timestamp, crossed_count_front, crossed_count_back))
                
            
            timestamp += 60000        
            crossed_count_back, crossed_count_front = 0, 0
                
        if not captured_frames % skip_frames == 0:
            captured_frames += 1
            continue

        captured_frames += 1

        if len(detection) == 0:
            tracked_objects = mot_tracker.update(np.array([]))
        else:
            detection = detection[:, 1:].cpu().detach().numpy()
            # filter persons
            detection = np.array([d for d in detection if int(d[-1]) == 0])
            tracked_objects = mot_tracker.update(detection)
    
        for tracked_object in tracked_objects:
            uid = int(tracked_object[4])
            cls_ind = int(tracked_object[5])
            p1 = (int(tracked_object[0]), int(tracked_object[1]))
            p2 = (int(tracked_object[2]), int(tracked_object[3]))
            xy = get_mid_bottom(p1, p2)
            
            previous_xy = previous_map.get(uid)
            crossed = False
            if previous_xy and uid not in crossed_already:
                cross_product1 = cross_product(linepoint1, linepoint2, xy)
                cross_product2 = cross_product(linepoint1, linepoint2, previous_xy)
                crossed, direction = different_side(cross_product1, cross_product2)

            if crossed:
                if debug:
                    frame = cv2.line(frame, (linepoint1.x, linepoint1.y), (linepoint2.x, linepoint2.y), (0, 255, 255), 9)

                    img = draw_bbox(frame, uid, p1, p2, cls_ind, True)
                    plt.imshow(img)
                    plt.show()

                crossed_already.add(uid)
                if direction == 'front':
                    crossed_count_front += 1
                else:
                    crossed_count_back += 1
                
            previous_map[uid] = xy

    return captured_frames, crossed_count_back, crossed_count_front, timestamp

def handle_video_list(
    batch_size,
    yolo_network,
    files,
    linepoint1,
    linepoint2,
    output_filename,
    debug,
    start_time_stamp,
    skip):
    captured_frames, crossed_count_back, crossed_count_front = 0, 0, 0
    timestamp = start_time_stamp
    if output_filename:
        with open(output_filename, 'w') as f:
            f.write('timestamp,forward-count,backward-count')
        
    for video_path in files:
        print('starting to parse', video_path)
        captured_frames, crossed_count_back, crossed_count_front, timestamp = parse_video_line_crossing_count(
            batch_size, yolo_network, video_path, linepoint1, linepoint2, output_filename,
            captured_frames, debug, timestamp, skip, crossed_count_back, crossed_count_front)

def paths_exist(list_of_paths):
    return all(os.path.exists(path) for path in list_of_paths)

def list_files(root, size, exclude):
    start_paths = [
        root + '/GAVM-02-3-Stadhouderskade/20200508/10/pc7-1330-GAVM-02-3-Stadhouderskade_20200508_104345005.mp4',
        root + '/GAVM-02-3-Stadhouderskade/20200508/10/pc7-1330-GAVM-02-3-Stadhouderskade_20200508_104346614.mp4',
        root + '/GAVM-02-3-Stadhouderskade/20200508/10/pc7-1330-GAVM-02-3-Stadhouderskade_20200508_104501799.mp4'
    ]

    # small size is the first hour(10) which is about 16 minutes
    if size == 'small':
        paths = start_paths

    # medium size is the first and second hour which is about 76 minutes
    if size == 'medium':
        prefix = root + '/GAVM-02-3-Stadhouderskade/20200508/11/'
        extra_paths = [os.path.join(prefix, p)
            for p in os.listdir(prefix) if p.endswith('.mp4')]
        paths = start_paths + extra_paths

    def isHour(h):
        try:
            return int(h) > -1 and int(h) < 24
        except: return False

    # large size is the first day which is about 14 hours
    if size == 'large':
        prefix = root + '/GAVM-02-3-Stadhouderskade/20200508/'
        hours = [h for h in
            os.listdir(prefix) if isHour(h)]
        paths = [os.path.join(prefix, h, p)
            for h in hours
            for p in os.listdir(prefix + '/' + h)
            if p.endswith('mp4')]

    # all size all files which is about 3 days
    if size == 'all':
        prefix = root + '/GAVM-02-3-Stadhouderskade/'
        days = os.listdir(prefix)
        hours = [os.path.join(prefix, d, h)
            for d in days
            for h in os.listdir(os.path.join(prefix, d))
            if isHour(h)]
        paths = [os.path.join(prefix, h, p)
            for h in hours
            for p in os.listdir(os.path.join(prefix, h))
            if p.endswith('mp4')]

    print('pppp', paths)
    if not paths_exist(paths):
        print('Some paths not found on the system. Make sure correct root is set to vondel directory.')
        sys.exit(1)

    return sorted(p for p in paths if not any(e in p for e in exclude))

parser = argparse.ArgumentParser(description='Parse .')
parser.add_argument('--root', type=str, help='The root of the vondel_park directory.', default=None)
parser.add_argument('--videos', type=str, help='Videos to seperate by ;', default=None)
parser.add_argument('--cuda', type=bool, default=True)
parser.add_argument('--timestamp_start', type=int, help='Timestamp of the first frame in the video', default=1588927424000)
parser.add_argument('--timestamp_start_data', type=int, help='Timestamp of the first frame in the video', default=None)
parser.add_argument('--size', choices=['small', 'medium', 'large', 'all'], help='Choose size of videos to parse.', default='small')
parser.add_argument('--linepoint1', help='Provide first linepoint seperate by , as in -> y,x', default='550,0')
parser.add_argument('--linepoint2', help='Provide second linepoint seperate by , as in -> y,x', default='400,2000')
parser.add_argument('output_filename', type=str, help='Csv file to write prediction to.')
parser.add_argument('--batch_size', type=int, help='Batch size', default=1)

args = parser.parse_args()

if args.root is None and args.videos is None:
    print('Either root argument or videos argument must be set')
    sys.exit(1)

if args.root is not None and args.videos is not None:
    print('Only root argument or videos argument must be set')
    sys.exit(1)

EXCLUDE_FILES = [
    'pc7-1330-GAVM-02-3-Stadhouderskade_20200508_104338439.mp4'
]

torch.cuda.empty_cache()
model = store.get_model_by_name('pretrained_yolov3')
cuda = False
yolo_network = ModelRegistry().get_network(
    'train_yolo.py',
    cuda=cuda,
    model_path=model.path
)
yolo_network.eval()
files = []
if args.videos:
    files = args.videos.split(';')

if args.root:
    files = list_files(args.root, args.size, EXCLUDE_FILES)

start_timestamp_in_video = args.timestamp_start
start_timestamp_in_data = args.timestamp_start_data
skip_seconds_at_start = 0 if not start_timestamp_in_data else (start_timestamp_in_data - start_timestamp_in_video) / 1000
print('skiping seconds at start:', skip_seconds_at_start)

linepoint1 = args.linepoint1.split(',')
linepoint1 = Point(y=int(linepoint1[0]), x=int(linepoint1[1]))
linepoint2 = args.linepoint2.split(',')
linepoint2 = Point(y=int(linepoint2[0]), x=int(linepoint2[1]))

handle_video_list(
    args.batch_size,
    yolo_network,
    files,
    linepoint1,
    linepoint2,
    args.output_filename,
    args.cuda,
    start_timestamp_in_data or start_timestamp_in_video,
    skip_seconds_at_start)

"""
example: 
- python scripts/predict_line_cross_count.py --videos files/public_datasets/TrackingVondel/GAVM-02-3-Stadhouderskade/20200508/10/pc7-1330-GAVM-02-3-Stadhouderskade_20200508_104501799.mp4 --timestamp_start 0 out.csv
- python scripts/predict_line_cross_count.py --root files/public_datasets/TrackingVondel out.csv
"""
