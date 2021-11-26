CREATE TABLE IF NOT EXISTS video_capture (
  running_job_id INTEGER REFERENCES jobs(id),
  output_stream_path TEXT,
  name TEXT,
  camera_id INTEGER REFERENCES camera(id),
  unique(output_stream_path)
)
