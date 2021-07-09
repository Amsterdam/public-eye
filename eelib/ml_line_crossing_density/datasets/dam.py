from . import basic_entities
import glob
import re
import json


def load_all_pairs(path, distance=1):
    base_path = '{}/training'.format(path)
    tagged = glob.glob('{}/*/tags*'.format(base_path))

    prog = re.compile('.*/([0-9]+)/tags_([0-9]+).json')

    ret = []

    for tag_file in tagged:
        result = prog.match(tag_file)

        with open(tag_file) as f:
            data = json.load(f)

        if result:
            video_id = int(result.group(1))
            frame_id = int(result.group(2))
        else:
            print("Nothing found")

        frame1 = basic_entities.BasicFrame('{}/{}/{}_001.jpg'.format(base_path, video_id, frame_id))
        for tag in data['tags']:
            frame1.add_point((tag['x'], tag['y']))

        frame2 = basic_entities.BasicFrame('{}/{}/{}_00{}.jpg'.format(base_path, video_id, frame_id, distance + 1))

        ret.append(basic_entities.BasicFramePair(frame1, frame2, distance=distance))

    return ret


def load_test_video(path):
    frames = glob.glob('{}/*.*'.format(path))
    frames.sort()
    video = basic_entities.BasicVideo(path)
    for framer in frames:
        video.add_frame(basic_entities.BasicFrame(framer))
    video.add_line(
        #basic_entities.BasicLineSample(video, (1150, 580), (1000, 900))
        basic_entities.BasicLineSample(video, (1400, 450), (10, 400))
    )
    return video

