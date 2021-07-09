import os
import numpy as np
from PIL import Image
from pathlib import Path


def generate_frame_pairs(frames, distance, skip_inbetween=False):
    pairs = []

    for i, frame1 in enumerate(frames):
        if skip_inbetween and i % distance != 0:
            continue

        if i + distance >= len(frames):
            break

        frame2 = frames[i + distance]
        pairs.append(BasicFramePair(frame1, frame2, distance=distance))
    return pairs

def n_split_pairs(frames, splits=3, distance=20, skip_inbetween=False):
    ret = []
    for s_split in np.array_split(frames, splits):
        ret.append(generate_frame_pairs(s_split, distance, skip_inbetween))

    return ret

"""
BasicVideo is an object used to store individual video's with frames.
It is the basic block for training and validating the model.
"""
class BasicVideo:
    def __init__(self, base_path, labeled=False):
        self.frames = []
        self.path = base_path
        self.pairs = None
        self.labeled = labeled
        self.lines = []

    def get_lines(self):
        return self.lines

    def add_line(self, line):
        self.lines.append(line)

    # Get all the BasicFrame objects of the video
    def get_frames(self):
        return self.frames

    def get_frame(self, frame_id):
        return self.frames[frame_id]

    # Add an individual BasicFrame to the video
    def add_frame(self, frame):
        self.frames.append(frame)

    # Get the base path of the video. The directory which stores all of the frames
    def get_path(self):
        return self.path

    # Return all frame pairs of the video
    def get_frame_pairs(self):
        if self.pairs is None:
            self.generate_frame_pairs()

        return self.pairs

    def generate_frame_pairs(self, distance=1, skip_inbetween=False):
        self.pairs = generate_frame_pairs(self.get_frames(), distance, skip_inbetween)

    def is_labeled(self):
        return self.labeled



"""
BasicFrame is the object which stores all the information of an individual frame
Both the frame path and the labeled information are stored here. 
"""
class BasicFrame:
    def __init__(self, image_path, labeled=False):
        self.centers = []
        self.is_moving = []
        self.image_path = image_path
        self.labeled = labeled

    # Get all the coordinates of the labeled heads in the frame
    def get_centers(self, only_moving=False):
        if only_moving:
            ret = []
            for i, t in enumerate(self.is_moving):
                if t:
                    ret.append(self.centers[i])
            return ret
        else:
            return self.centers

    # Add an individual head location
    def add_point(self, xy, bbox = None, moving=False):
        self.labeled = True
        self.centers.append((int(xy[0]), int(xy[1])))
        self.is_moving.append(moving)

    # Retrieve the image path
    def get_image_path(self):
        return self.image_path

    def get_info_dir(self, file=None, check_exists=False):
        path = os.path.splitext(self.image_path)[0]

        if check_exists:
            Path(path).mkdir(parents=True, exist_ok=True)

        if file:
            path = '{}/{}'.format(path, file)
        return path

    # Retrieve the path where the generated density map is stored
    def get_density_path(self, type = None, check_exists=False):
        if type:
            type = '_{}'.format(type)
        else:
            type = ''
        return self.get_info_dir("density{}.npy".format(type), check_exists)

    # Return a Pillow link to the image file data.
    def get_image(self):
        return Image.open(self.get_image_path())

    # Return the BasicFrame's corresponding RAW image data as a Numpy array.
    def load_image_data(self):
        img = Image.open(self.get_image_path())
        image_data = self.image_data = np.asarray(img)
        img.close()
        return image_data

    # Get the numpy array of the density map
    def get_density(self, type = None):
        return np.load(self.get_density_path(type))

    def is_labeled(self):
        return self.labeled


"""
An object which holds two frames and the tracking information between the two frames (if available)
"""
class BasicFramePair:
    def __init__(self, frame1, frame2, labeled=False, distance=1):
        self.frame1 = frame1
        self.frame2 = frame2
        self.pairs = {}
        self.labeled = labeled
        self.distance = distance

    # Add the point pair to the dictionary
    def add_point_pair(self, frame1_id, frame2_id):
        self.labeled = True
        self.pairs[frame1_id] = frame2_id

    # Returns all the point pairs in a dictionary, where key is the id in frame 1 with the value the id in frame 2.
    def get_point_pairs(self):
        return self.pairs

    # Get the two frames, when only requiring 1, the index of the frame is given as parameter
    def get_frames(self, frame=None):
        ret = (self.frame1, self.frame2)

        if frame is None:
            return ret
        else:
            return ret[frame]

    def is_labeled(self):
        return self.labeled

    # How many frames are between the first and second frame
    def get_distance(self):
        return self.distance


class BasicLineSample:
    def __init__(self, video, point1, point2, labeled=False):
        self.video = video
        self.point1 = point1
        self.point2 = point2
        self.labeled = labeled
        self.crossed = (0, 0)

        self.crossings = None

    def set_crossed(self, l1, l2):
        self.crossed = (l1, l2)
        self.labeled = True

    def add_crossing(self, frame_num, side):
        if self.crossings is None:
            self.crossings = [[], []]

        self.crossings[side].append(frame_num)

    def get_crossings(self, side=None):
        if side is not None:
            return self.crossings[side]
        else:
            return self.crossings

    def get_crossed(self):
        if self.crossings is not None:
            return len(self.crossings[0]), len(self.crossings[1])
        else:
            return self.crossed

    def get_video(self):
        return self.video

    def get_line(self):
        return (self.point1, self.point2)