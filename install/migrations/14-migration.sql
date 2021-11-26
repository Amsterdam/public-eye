CREATE TABLE IF NOT EXISTS model_tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_tags_link (
  model_id INTEGER REFERENCES models(id),
  model_tags_id INTEGER REFERENCES model_tags(id)
);

ALTER TABLE models ADD COLUMN annotation TEXT;
