# Ingest fake data

## Steps

- Download png files from [Google Drive](https://drive.google.com/drive/folders/1Jx9Fqt4QgqaQf0EAX9vtvx8RWAuAh3F5?usp=sharin://drive.google.com/open?id=1uL972t3Z5hQjFyZ7OjprPlCK0HmpLcBP)
- Put all the png files into files/frames/cam_study
- run `touch files/videos/fake-video.mp4`
- make sure you are in eagle_eye_p3 virtualenv
- run `python install/dev_mock_data/ingest_temp_data.py`

If stuff goes wrong, make sure EAGLE_EYE_PATH and PYTHONPATH are set according to install/INSTALL.md and that you are in the correct virtualenv. 
Also check if postgres works and if config.json is configured correctly
