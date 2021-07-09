ALTER TABLE stream_capture DROP COLUMN IF EXISTS stream_url;

ALTER TABLE stream_instance DROP COLUMN IF EXISTS stream_url;

ALTER TABLE stream_roi DROP COLUMN IF EXISTS stream_capture_id;

ALTER TABLE calibration DROP COLUMN IF EXISTS stream_capture_id;
