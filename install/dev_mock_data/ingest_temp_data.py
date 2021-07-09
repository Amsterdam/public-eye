import sys
import eelib.postgres as pg
import json
import os
import glob
import time

def insert_video_file_if_not_exists(video_path):
    with pg.get_cursor() as cursor:
        result = cursor.one('SELECT * FROM video_files WHERE path=%(path)s', { 'path': video_path })
        if result is not None:
            return result
        cursor.run(
                'INSERT INTO video_files (path) VALUES (%(path)s)',
                {
                    'path': video_path
                }
        )
        return cursor.one('SELECT * FROM video_files WHERE path=%(path)s', { 'path': video_path })

def insert_tag_if_not_exists(frame_id, cx, cy):
    with pg.get_cursor() as cursor:
        result = cursor.one(
                'SELECT * FROM tags WHERE x=%(x)s AND y=%(y)s AND frame_id=%(frame_id)s',
                {
                    'x': cx,
                    'y': cy,
                    'frame_id': frame_id
                }
        )
        if result is not None:
            return result
        cursor.run(
                'INSERT INTO tags (frame_id, x, y) VALUES (%(frame_id)s, %(x)s, %(y)s)',
                {
                    'frame_id': frame_id,
                    'x': cx,
                    'y': cy
                }
        )
        return cursor.one(
                'SELECT * FROM tags WHERE x=%(x)s AND y=%(y)s AND frame_id=%(frame_id)s',
                {
                    'x': cx,
                    'y': cy,
                    'frame_id': frame_id
                }
        )

def insert_frame_if_not_exists(video_id, frame_path):
    with pg.get_cursor() as cursor:
        result = cursor.one('SELECT * FROM frames WHERE path=%(path)s', { 'path': frame_path })
        if result is not None:
            return result
        cursor.run(
                'INSERT INTO frames (path, video_file_id, timestamp) VALUES (%(path)s, %(video_file_id)s, %(timestamp)s)',
                {
                    'path': frame_path,
                    'video_file_id': video_id,
                    'timestamp': 0
                }
        )
        return cursor.one('SELECT * FROM frames WHERE path=%(path)s', { 'path': frame_path })

def main():

    pg.connect()

    root_dir = os.environ['EAGLE_EYE_PATH']
    files_dir = os.path.join(root_dir, 'files')
    frames_dir = os.path.join(files_dir, 'frames', 'cam_study')

    with open(os.path.join(root_dir, 'install/dev_mock_data/camera_study_august_23-26_annotations.json'), 'r') as json_file:
        data = json.load(json_file)

    video = insert_video_file_if_not_exists(os.path.join(root_dir, 'files/videos/fake-video.mp4'))
    print(video)

    frame_files = {}
    for file in glob.glob(os.path.join(frames_dir, '*.png')):
        frame = insert_frame_if_not_exists(video.id, file)
        print(frame)
        frame_files[os.path.basename(file)] = frame

    for filename, filedata in data.items():
        if filename not in frame_files:
            print("ERROR")
            return
        frame = frame_files[filename]
        print('insert tags for frame: {}'.format(frame))
        for region_n, region_data in filedata['regions'].items():
            shape_attr = region_data['shape_attributes']
            if shape_attr['name'] == 'point':
                cx = shape_attr['cx']
                cy = shape_attr['cy']
                tag = insert_tag_if_not_exists(frame.id, cx, cy)
                #print(tag)

main()
