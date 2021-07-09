ALTER TABLE selected_labels DROP COLUMN dataset_id;

ALTER TABLE selected_labels ADD COLUMN model_id INTEGER REFERENCES models(id);
