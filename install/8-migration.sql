CREATE TABLE IF NOT EXISTS multicapture_stream (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  running_job_id INTEGER REFERENCES jobs(id),
  unique(name)
);
