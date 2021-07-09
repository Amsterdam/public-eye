CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(124) UNIQUE NOT NULL,
  password VARCHAR(124) NOT NULL
);

CREATE TABLE IF NOT EXISTS video_files (
  id SERIAL PRIMARY KEY,
  path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS frames (
  id SERIAL PRIMARY KEY,
  video_file_id INTEGER REFERENCES video_files(id),
  path TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  locked BOOLEAN
);

CREATE TABLE IF NOT EXISTS collection_frame (
  collection_id INTEGER REFERENCES collections(id),
  frame_id INTEGER REFERENCES frames(id),
  UNIQUE(collection_id, frame_id)
);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  frame_id INTEGER REFERENCES frames(id),
  x INTEGER NOT NULL,
  y INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS neural_network_type (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS neural_networks (
  id SERIAL PRIMARY KEY,
  train_script TEXT NOT NULL UNIQUE,
  nn_type_id INTEGER REFERENCES neural_network_type(id)
);


CREATE TABLE IF NOT EXISTS datasets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(256) NOT NULL UNIQUE,
  nn_type_id INTEGER REFERENCES neural_network_type(id)
);

CREATE TABLE IF NOT EXISTS ground_truths (
  id SERIAL PRIMARY KEY,
  frame_id INTEGER REFERENCES frames(id),
  dataset_id INTEGER REFERENCES datasets(id),
  path TEXT NOT NULL,
  render_path TEXT
);

CREATE TABLE IF NOT EXISTS groundtruth_dataset (
  ground_truth_id INTEGER REFERENCES ground_truths(id),
  dataset_id INTEGER REFERENCES datasets(id),
  UNIQUE(ground_truth_id, dataset_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  job_script_path VARCHAR(1024) NOT NULL,
  job_script_payload TEXT NOT NULL, 
  creation_date BIGINT NOT NULL,
  job_status VARCHAR(124) NOT NULL,
  log_path TEXT,
  err_log_path TEXT,
  pid INT NOT NULL
);

CREATE TABLE IF NOT EXISTS models (
  id SERIAL PRIMARY KEY,
  neural_network_id INTEGER REFERENCES neural_networks(id),
  path TEXT NOT NULL,
  name TEXT
);

CREATE TABLE IF NOT EXISTS train_configs (
  id SERIAL PRIMARY KEY,
  path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS training_runs (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP NOT NULL,
  training_set_id INTEGER REFERENCES datasets(id),
  neural_network_id INTEGER REFERENCES neural_networks(id),
  validation_set_id INTEGER REFERENCES datasets(id),
  model_id INTEGER REFERENCES models(id),
  log_file_path TEXT NOT NULL,
  job_id INTEGER REFERENCES jobs(id),
  config_id INTEGER REFERENCES train_configs(id)
);


CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  score_name TEXT NOT NULL,
  training_run_id INTEGER REFERENCES training_runs(id),
  score_value REAL NOT NULL
);


CREATE TABLE IF NOT EXISTS labels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  rgb TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bounding_boxes (
  id SERIAL PRIMARY KEY,
  frame_id INTEGER REFERENCES frames(id),
  label_id INTEGER REFERENCES labels(id),
  x REAL NOT NULL,
  y REAL NOT NULL,
  w REAL NOT NULL,
  h REAL NOT NULL,
  UNIQUE(frame_id, x, y, w, h)
);

CREATE TABLE IF NOT EXISTS frame_object_recognition_dataset (
  frame_id INTEGER REFERENCES frames(id),
  dataset_id INTEGER REFERENCES datasets(id),
  UNIQUE(frame_id, dataset_id)
);

CREATE TABLE IF NOT EXISTS selected_labels (
  label_id INTEGER REFERENCES labels(id),
  dataset_id INTEGER REFERENCES datasets(id),
  index INTEGER NOT NULL,
  UNIQUE(label_id, dataset_id)
);

INSERT INTO users (email, password) VALUES ('temp@dontuse.nl', '$2b$10$UVSZ8YpPI.zuZdqnMgDGIObTdHny17HHtzJ61vwv8QtNl8yd7Y9CW');
INSERT INTO users (email, password) VALUES ('example@email.com', '$2b$10$FAweM31u.oqMvmCTuryMBOlpXXM1.rLIDBF92mFmKyfVycGR1VYwO');
INSERT INTO neural_network_type (name) values ('density_estimation');
INSERT INTO neural_network_type (name) values ('object_recognition');
INSERT INTO neural_networks (train_script, nn_type_id) VALUES ('train_csrnet.py', 1);
INSERT INTO neural_networks (train_script, nn_type_id) VALUES ('train_cacc.py', 1);
INSERT INTO neural_networks (train_script, nn_type_id) VALUES ('train_mcnn.py', 1);
INSERT INTO neural_networks (train_script, nn_type_id) VALUES ('train_garb.py', 2);