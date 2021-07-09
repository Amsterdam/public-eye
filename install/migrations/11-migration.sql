CREATE TABLE IF NOT EXISTS camera (
  id SERIAL PRIMARY KEY,
  stream_url TEXT NOT NULL,
  name TEXT,
  azimuth TEXT,
  supplier TEXT,
  geo_long TEXT,
  geo_lat TEXT,
  fps INTEGER DEFAULT 24,
  unique(stream_url)
);

INSERT INTO camera (stream_url) (SELECT stream_url FROM stream_instance) ON CONFLICT DO NOTHING;
INSERT INTO camera (stream_url) (SELECT stream_url FROM stream_capture) ON CONFLICT DO NOTHING;

/* update stream_instance table */
ALTER TABLE stream_instance ADD COLUMN camera_id INTEGER REFERENCES camera(id);

UPDATE stream_instance
SET camera_id=subquery.camera_id
FROM (
  SELECT stream_instance.id as stream_instance_id, camera.id as camera_id
  FROM stream_instance JOIN camera
  ON stream_instance.stream_url = camera.stream_url
) as subquery
WHERE stream_instance.id=subquery.stream_instance_id;

/* update stream_capture table */
ALTER TABLE stream_capture ADD COLUMN camera_id INTEGER REFERENCES camera(id) UNIQUE;

UPDATE stream_capture
SET camera_id=subquery.camera_id
FROM (
  SELECT stream_capture.id as stream_capture_id, camera.id as camera_id
  FROM stream_capture JOIN camera
  ON stream_capture.stream_url = camera.stream_url
) as subquery
WHERE stream_capture.id=subquery.stream_capture_id;

/* update stream_roi to link to camera directly */
ALTER TABLE stream_roi ADD COLUMN camera_id INTEGER REFERENCES camera(id);

UPDATE stream_roi
SET camera_id=subquery.camera_id
FROM (
  SELECT stream_roi.id as stream_roi_id, camera.id as camera_id
  FROM stream_roi
  JOIN stream_capture ON stream_roi.stream_capture_id=stream_capture.id
  JOIN camera ON stream_capture.camera_id = camera.id
) as subquery
WHERE stream_roi.id=subquery.stream_roi_id;

/* update calibration to link to camera directly */
ALTER TABLE calibration ADD COLUMN camera_id INTEGER REFERENCES camera(id);

UPDATE calibration
SET camera_id=subquery.camera_id
FROM (
  SELECT calibration.id as calibration_id, camera.id as camera_id
  FROM calibration
  JOIN stream_capture ON calibration.stream_capture_id=stream_capture.id
  JOIN camera ON stream_capture.camera_id = camera.id
) as subquery
WHERE calibration.id=subquery.calibration_id;
