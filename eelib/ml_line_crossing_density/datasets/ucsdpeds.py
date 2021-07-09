import scipy.io
from . import basic_entities
from glob import glob


def get_point_locations_mat(path, factor=3.0252):
    mat = scipy.io.loadmat(path)
    frames = []
    for i, frame in enumerate(mat['fgt'][0][0][0][0]):
        frame_ret = []
        dots = frame[0][0][0]  # (X, Y, 1)
        for dot in dots:
            x = dot[0] * factor
            y = dot[1] * factor
            frame_ret.append([x, y])

        frames.append(frame_ret)
    return frames


def load_countings(path):
    mat = scipy.io.loadmat('{}/line_crossing/cgt_s_all.mat'.format(path))
    left_cross = mat['cgt_s_all'][0][0][0]  # Left
    right_cross = mat['cgt_s_all'][0][1][0]  # Right

    left_cross = list(left_cross[:600]) + list(left_cross[1400:2000])
    right_cross = list(right_cross[:600]) + list(right_cross[1400:2000])

    return left_cross, right_cross

def load_videos(path, factor=3.0252):
    mat = scipy.io.loadmat('{}/line_crossing/cgt_s_all.mat'.format(path))
    left_cross = mat['cgt_s_all'][0][0][0]  # Left
    right_cross = mat['cgt_s_all'][0][1][0]  # Right

    small_videos = glob('{}/images/vidf/vidf1_*/'.format(path))
    small_videos.sort()

    location_mats = glob('{}/gt/vidf/vidf1_33_*_frame_full.mat'.format(path))
    location_mats.sort()

    frames_orig = glob('{}/orig_images/out_*.png'.format(path))
    frames_orig.sort()

    all_small_frames = glob('{}/images/vidf/vidf1_*/*'.format(path))
    all_small_frames.sort()

    videos = []

    for small_video, location_mat in zip(small_videos, location_mats):
        points = get_point_locations_mat(location_mat, factor)
        small_frames = glob('{}*.png'.format(small_video))
        small_frames.sort()

        first_frame_id = all_small_frames.index(small_frames[0])
        last_frame_id = all_small_frames.index(small_frames[-1])

        video = basic_entities.BasicVideo(small_video)

        if first_frame_id < 2000:
            line = basic_entities.BasicLineSample(small_video, (99 * factor, 1 * factor), (100 * factor, 158 * factor))
            line.set_crossed(sum(left_cross[first_frame_id:last_frame_id + 1]),
                             sum(right_cross[first_frame_id:last_frame_id + 1]))
            video.add_line(line)

        for dots, s_frame in zip(points, small_frames):
            o_frame = frames_orig[all_small_frames.index(s_frame)]
            frame = basic_entities.BasicFrame(o_frame)
            for dot in dots:
                frame.add_point(dot)

            video.add_frame(frame)

        videos.append(video)

    return videos