CREATE TABLE IF NOT EXISTS stream_roi (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  stream_capture_id INTEGER REFERENCES stream_capture(id),
  polygons REAL[][4][2]
);
