CREATE TABLE IF NOT EXISTS calibration (
  id SERIAL PRIMARY KEY,
  stream_capture_id INTEGER REFERENCES stream_capture(id),
  matrix_a FLOAT,
  matrix_b FLOAT,
  matrix_c FLOAT,
  matrix_d FLOAT,
  scaling_factor FLOAT
);
