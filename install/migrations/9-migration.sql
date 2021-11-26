
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'frame_type') THEN
    CREATE TYPE FRAME_TYPE AS ENUM('video', 'collection', 'stream');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS frames_metadata (
  ts_vid INTEGER,
  ts_utc TIMESTAMP,
  type FRAME_TYPE NOT NULL,
  frames_id INTEGER REFERENCES frames(id),
  unique(frames_id)
)
