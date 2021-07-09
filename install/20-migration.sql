ALTER TABLE neural_networks ADD COLUMN IF NOT EXISTS hidden_to_user BOOLEAN DEFAULT false;
ALTER TABLE neural_networks ADD COLUMN IF NOT EXISTS name TEXT;

UPDATE neural_networks SET name = 'Yolo v3 Garbage' WHERE train_script = 'train_garb.py';
UPDATE neural_networks SET name = 'CSRNet' WHERE train_script = 'train_csrnet.py';
UPDATE neural_networks SET name = 'MCNN' WHERE train_script = 'train_mcnn.py';
UPDATE neural_networks SET name = 'CSRNet' WHERE train_script = 'train_csrnet.py';
UPDATE neural_networks SET name = 'CACC' WHERE train_script = 'train_cacc.py';
UPDATE neural_networks SET name = 'Yolo v3' WHERE train_script = 'train_yolo.py';
UPDATE neural_networks SET name = 'Yolo v5 small' WHERE train_script = 'train_yolov5s.py';
UPDATE neural_networks SET name = 'Yolo v3' WHERE train_script = 'train_yolo.py';
UPDATE neural_networks SET name = 'Line of Interest Density' WHERE train_script = 'train_loi_density.py';
UPDATE neural_networks SET hidden_to_user = true WHERE train_script = 'train_yolov5s.py';
UPDATE neural_networks SET hidden_to_user = true WHERE train_script = 'train_loi_density2.py';
