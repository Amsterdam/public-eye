CREATE TABLE IF NOT EXISTS stream_capture (
  id SERIAL PRIMARY KEY,
  stream_url TEXT NOT NULL,
  capture_path TEXT NOT NULL,
  unique(stream_url)
);
