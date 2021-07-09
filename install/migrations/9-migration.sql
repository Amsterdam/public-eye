CREATE TYPE FRAME_TYPE AS ENUM('video', 'collection', 'stream');

CREATE TABLE IF NOT EXISTS frames_metadata (
  ts_vid INTEGER,
  ts_utc TIMESTAMP,
  type FRAME_TYPE NOT NULL,
  frames_id INTEGER REFERENCES frames(id),
  unique(frames_id)
)
