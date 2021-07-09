ALTER TABLE ground_truths
DROP CONSTRAINT ground_truths_dataset_id_fkey,
ADD CONSTRAINT ground_truths_dataset_id_fkey
    FOREIGN KEY (dataset_id)
    REFERENCES datasets(id)
    ON DELETE CASCADE;

ALTER TABLE frame_object_recognition_dataset
DROP CONSTRAINT frame_object_recognition_dataset_dataset_id_fkey,
ADD CONSTRAINT frame_object_recognition_dataset_dataset_id_fkey
    FOREIGN KEY (dataset_id)
    REFERENCES datasets(id)
    ON DELETE CASCADE;

ALTER TABLE frame_pair_loi_dataset
DROP CONSTRAINT frame_pair_loi_dataset_dataset_id_fkey,
ADD CONSTRAINT frame_pair_loi_dataset_dataset_id_fkey
    FOREIGN KEY (dataset_id)
    REFERENCES datasets(id)
    ON DELETE CASCADE;
