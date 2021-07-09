CREATE TABLE IF NOT EXISTS stream_instance (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  model_id INTEGER REFERENCES models(id),
  neural_network_id INTEGER REFERENCES neural_networks(id),
  running_job_id INTEGER REFERENCES jobs(id),
  output_stream_path TEXT,
  unique(name),
  unique(output_stream_path)
);
