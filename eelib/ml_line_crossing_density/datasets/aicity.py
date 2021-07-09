from glob import glob
import os
import json
import numpy as np
from PIL import Image

from . import basic_entities as entities

lines = {
    'S01/c002': [[(650,370), (1900, 400)]],
    'S01/c005': [[(1000, 300), (1250, 480)]],
    'S02/c006': [[(1, 550), (1400, 600)]],
    'S02/c009': [[(1, 620), (1300, 580)]]
}

def create_roi(video):
    video_path = '/'.join(video.get_path().split('/')[-2:])
    base_path = '/'.join(video.get_path().split('/')[:-2])
    roi_path = '{}/ROI/{}.jpg'.format(base_path, video_path)
    img = Image.open(roi_path)
    roi = np.asarray(img)/255
    return roi

def ped_crossed_line(ped_traject, line):
    frames = list(ped_traject.keys())
    frames.sort()

    points = []
    for f_i in frames:
        points.append(ped_traject[f_i])
    points = np.array(points)

    base_point = np.array(line[0])
    line_vector = np.array(line[1]) - base_point
    line_points = points - base_point

    upper_proj = np.dot(line_points, line_vector)
    lower_proj = np.linalg.norm(line_vector) ** 2
    proj = upper_proj / lower_proj
    inside = np.array([proj >= 0, proj <= 1]).all(axis=0)

    # Are you on the right side of the line
    check = (line_vector[0] * line_points[:, 1] - line_vector[1] * line_points[:, 0]) > 0;

    # If it didn't cross, then no need to check further
    if np.all(check == check[0]):
        return False

    # Grab the places where crosses happen
    check2 = np.roll(check, 1)
    together = check[1:] != check2[1:]
    poses = np.where(together == True)[0]

    pos = None
    for pos_i in poses:
        if inside[pos_i] == False:
            continue

        # Should do filtering????

        pos = pos_i

    if pos == None:
        return False

    return (int(check[pos + 1]), frames[pos])

def load_video(base_path, video_path, load_labeling=True):
    frames = glob('{}/frames/{}/*.jpg'.format(base_path, video_path))
    frames.sort()

    video = entities.BasicVideo('{}/{}'.format(base_path, video_path))

    with open('{}/gt/{}.txt'.format(base_path, video_path)) as f:
        content = f.readlines()


    framer = {}
    for o, line in enumerate(content):
        splitted = line.split(',')
        frame_num = int(splitted[0])
        ID = int(splitted[1])

        if frame_num not in framer:
            framer[frame_num] = {}

        framer[frame_num][ID] = (int(splitted[2]) + int(splitted[4]) / 2, int(splitted[3]) + int(splitted[5]) / 2)

    for i, frame_path in enumerate(frames):
        frame_obj = entities.BasicFrame(frame_path)
        video.add_frame(frame_obj)

        if load_labeling:
            if i+1 in framer:
                for point_i in framer[i+1]:
                    if i+3 in framer and point_i in framer[i+3]:
                        speed = np.linalg.norm(np.array(framer[i+1][point_i]) - np.array(framer[i+3][point_i]))
                        if speed > 6:
                            moving = True
                        else:
                            moving = False
                    else:
                        moving = False

                    frame_obj.add_point(framer[i+1][point_i], moving=moving)

    # Add line crossing
    if load_labeling:
        framer = {}
        for o, line in enumerate(content):
            splitted = line.split(',')
            frame_num = int(splitted[0])
            ID = int(splitted[1])

            if ID not in framer:
                framer[ID] = {}

            framer[ID][frame_num] = (int(splitted[2]) + int(splitted[4]) / 2, int(splitted[3]) + int(splitted[5]) / 2)

        for line in lines[video_path]:
            line_obj = entities.BasicLineSample(video, line[0], line[1])
            for ped in framer:
                finder = ped_crossed_line(framer[ped], line)
                if finder is not False:
                    line_obj.add_crossing(finder[1], finder[0])

            video.add_line(line_obj)

    return video

def load_all_videos(base_path, load_labeling=True):
    videos = []
    paths = glob('{}/frames/*/*'.format(base_path))
    for video in paths:
        video_path = '/'.join(video.split('/')[-2:])
        videos.append(load_video(base_path, video_path=video_path, load_labeling=load_labeling))

    return videos


# Split the video and the crossing information into train and test information
def split_train_test(videos, train=0.5):
    train_videos = []
    test_videos = []
    for video in videos:
        frames = video.get_frames()
        train_vid = entities.BasicVideo(video.get_path())
        test_vid = entities.BasicVideo(video.get_path())

        test_start_index = int(len(frames)*train)

        # Copy line information and split
        for line in video.get_lines():
            train_line = entities.BasicLineSample(train_vid, line.get_line()[0], line.get_line()[1])
            train_vid.add_line(train_line)
            test_line = entities.BasicLineSample(test_vid, line.get_line()[0], line.get_line()[1])
            test_vid.add_line(test_line)

            for cross in line.get_crossings(0):
                if cross < test_start_index:
                    train_line.add_crossing(cross, 0)
                else:
                    test_line.add_crossing(cross-test_start_index, 0)

            for cross in line.get_crossings(1):
                if cross < test_start_index:
                    train_line.add_crossing(cross, 1)
                else:
                    test_line.add_crossing(cross-test_start_index, 1)

        # Split frames
        for frame in frames[:test_start_index]:
            train_vid.add_frame(frame)

        for frame in frames[test_start_index:]:
            test_vid.add_frame(frame)

        train_videos.append(train_vid)
        test_videos.append(test_vid)

    return train_videos, test_videos


if __name__ == '__main__':
    videos = load_all_videos('data/AICity')
    train, test = split_train_test(videos)

    for i, tr in enumerate(train):
        print(tr.get_path())
        for o, line in enumerate(tr.get_lines()):
            print("Crossing", line.get_crossed(), test[i].get_lines()[o].get_crossed())