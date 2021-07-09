from glob import glob
import os
import json

from . import basic_entities as entities

def load_video(video_path, load_labeling=True):
    frames = glob(os.path.join(video_path, '*.jpg'))
    frames.sort()

    video = entities.BasicVideo(video_path)
    if load_labeling:
        try:
            with open('{}info.json'.format(video_path)) as json_file:
                data = json.load(json_file)
                for line in data['labels']:
                    ent_line = entities.BasicLineSample(video, (line['x1'][0], line['x1'][1]),
                                                        (line['x2'][0], line['x2'][1]))
                    ent_line.set_crossed(line['l1'], line['l2'])
                    video.add_line(ent_line)
        except IOError:
            pass

    for frame_path in frames:
        frame_obj = entities.BasicFrame(frame_path)
        video.add_frame(frame_obj)

        if load_labeling:
            with open(frame_obj.get_image_path().replace('.jpg', '.json')) as json_file:
                data = json.load(json_file)
                data = data[list(data)[0]]  # Get the actual metadata for this frame.

                for region in data['regions']:
                    region = region['shape_attributes']
                    frame_obj.add_point(xy=(region['x'], region['y']))

    return video


def load_all_frames(base_path, load_labeling=True):
    frames = []
    for video_path in glob(os.path.join(base_path, '*')):
        frames = frames + load_video(video_path, load_labeling).get_frames()

    return frames


def load_all_frame_pairs(base_path, load_labeling=True, frames_between=1):
    frame_pairs = []
    for video_path in glob(os.path.join(base_path, '*')):
        video = load_video(video_path, load_labeling)
        video.generate_frame_pairs(distance=frames_between)
        frame_pairs = frame_pairs + video.get_frame_pairs()

    return frame_pairs

def load_train_test_frames(base_path, train=0.8, load_labeling=True):
    train_frames = []
    test_frames = []
    for video_path in glob(os.path.join(base_path, '*')):
        video_frames = load_video(video_path, load_labeling).get_frames()
        len_frames = len(video_frames)
        train_frames = train_frames + video_frames[:int(len_frames*train)]
        test_frames = test_frames + video_frames[int(len_frames * train):]

    return train_frames, test_frames


if __name__ == '__main__':
    train_frames = load_all_frames('data/Fudan/train_data')
    print(len(train_frames))
