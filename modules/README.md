# Example of post requests for each module

### Create Dataset
POST /jobs
```json
{
   "scriptName" : "create_dataset.py",
   "scriptArgs": {
        "dataset_name": "my test set",
        "frames": [5,10,11,12],
        "density_config": {
            "sigma": 12,
            "beta": -1,
        }
   }
}
```
### Ingest Video File
POST /jobs
```json
{
   "scriptName" : "ingest_video_file.py",
   "scriptArgs": {
        "video_file_path": "/home/ubuntu/eagle_eye/files/videos/bijlmer_experiment/20180101_140821A.mp4"
    }
}
```
### Train CACC
POST /jobs
```json
{
   "scriptName" : "train_cacc.py",
   "scriptArgs": {
        "train_dataset_id": 16,
        "val_dataset_id": 17,
        "epochs": 1
    }
}
```
### Train CSRNet
POST /jobs
```json
{
   "scriptName" : "train_csrnet.py",
   "scriptArgs": {
        "train_dataset_id": 16,
        "val_dataset_id": 17,
        "epochs": 1
    }
}
```
### Train MCNN
POST /jobs
```json
{
   "scriptName" : "train_mcnn.py",
   "scriptArgs": {
        "train_dataset_id": 16,
        "val_dataset_id": 17,
        "epochs": 1
    }
}
```

# Specifying arguments

The arguments of a module can specified in an <script_name>-args.json file.
Each arguments should appear on the root level. 
