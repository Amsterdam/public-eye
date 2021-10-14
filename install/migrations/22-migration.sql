INSERT INTO neural_network_type (name) VALUES ('density_estimation_transformer');

INSERT INTO neural_networks (train_script, nn_type_id, name, hidden_to_user) VALUES ('train_vicct.py', 4, 'VICCT', false);

DELETE FROM neural_networks WHERE train_script = 'train_mcnn.py';
DELETE FROM neural_networks WHERE train_script = 'train_cacc.py';

UPDATE neural_networks SET name = 'Line of Interest Density 2' WHERE train_script = 'train_loi_density2.py';
UPDATE neural_networks SET name = 'Yolo v5s' WHERE train_script = 'train_yolov5s.py';
