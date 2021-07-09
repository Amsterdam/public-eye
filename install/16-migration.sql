CREATE TABLE IF NOT EXISTS frame_pair_loi_dataset (
  id SERIAL PRIMARY KEY,
  input_frame_id INTEGER REFERENCES frames(id),
  target_frame_id INTEGER REFERENCES frames(id),
  dataset_id INTEGER REFERENCES datasets(id)
);

-- Some frames should not be exposed in the user interface for tagging
ALTER TABLE frames ADD COLUMN hidden_to_user Boolean;
