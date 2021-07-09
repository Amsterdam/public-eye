CREATE TABLE IF NOT exists video_captured_by_camera (
  camera_id INTEGER REFERENCES camera(id) ON DELETE CASCADE,
  video_file_id INTEGER REFERENCES video_files(id) ON DELETE CASCADE
);

ALTER TABLE jobs ADD COLUMN created_by_user_id INTEGER REFERENCES users(id);
