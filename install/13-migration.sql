CREATE TABLE IF NOT EXISTS stream_loi (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  camera_id INTEGER REFERENCES camera(id),
  polygons REAL[][2][2]
);

DO $$
DECLARE typeId integer;

BEGIN
  INSERT INTO neural_network_type (name) VALUES ('line_crossing_density') RETURNING id INTO typeId;
  INSERT INTO neural_networks (train_script, nn_type_id) VALUES ('train_loi_density2.py', typeId);
  INSERT INTO neural_networks (train_script, nn_type_id) VALUES ('train_loi_density.py', typeId);
END $$;

