import os
import subprocess
import uuid


def extract_frame(video_file_path, timestamp):
    try:
        basePath = os.environ['EAGLE_EYE_PATH']
        framepath = f"{basePath}/files/frames/img_{uuid.uuid4()}.jpg"
        ffmpeg_command = [
            'ffmpeg', '-loglevel', 'quiet', '-i', video_file_path, '-ss',
            str(timestamp), '-vframes', '1', framepath]
        p = subprocess.Popen(ffmpeg_command)
        p.wait()
        return framepath
    except Exception as e:
        print(f"error: {e}")
        return None
