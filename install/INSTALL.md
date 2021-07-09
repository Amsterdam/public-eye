# Installation

- The Eagle Eye platform has been verified to work on Ubuntu 20.04 (LTS) and 18.04 (LTS) and Windows 10.
- During this installation guide, we assume that your Linux username is '**username**'. Please change this **username** string with your actual Linux username in the installation commands.
- We assume Python 3.x is installed (e.g. Python 3.8).
- You must use Node 13.14. Node 14 won't work yet
- Cuda 10.2 and Pytorch 1.6

## Basic

- Copy this repo to you local machine:
    - `git clone git@github.com:MarkusPfundstein/eagle_eye.git`)
- Install project prerequisites:
    - `sudo apt install -y build-essential`
    - `sudo apt install ffmpeg`
    - `sudo apt install unzip`
    - `sudo apt install virtualenv`
- Modify `vim ~/.bashrc`. Add the following lines to your .bashrc file (here we assume that you cloned this repo into the folder /home/ubuntu/eagle_eye. Please modify these lines to reflect your actual location of the repo):
```
export EAGLE_EYE_PATH=/home/ubuntu/eagle_eye
export PYTHONPATH=${PYTHONPATH}:${EAGLE_EYE_PATH}
```

Create directory in `$EAGLE_EYE_PATH/files`. You can also symlink here if you want extneral storage.
The following directories must be present in `$EAGLE_EYE_PATH/files`: `configs frames gts logs models public_datasets stream_capture stream-outputs streams streams_output videos`

## Python

We will now create a virtual Python environment which will be used by Eagle Eye. We set up this virtual environment using the following commands:
- `cd $EAGLE_EYE_PATH`
- `virtualenv --python=/usr/bin/python3 eagle_eye_p3`
- `source eagle_eye_p3/bin/activate`
- `pip install postgres==3.0.0 torch==1.6.0 Pillow scipy opencv-python matplotlib torchvision==0.7.0 tqdm h5py jupyter imageio watchdog requests wget pyyaml psutil cupy==7.6`
- `deactivate`

By default, this environment is used by the node backend of Eagle Eye. We can activate this virtual environment manually for testing purposes by running `source eagle_eye_p3/bin/activate` in the EAGLE_EYE_PATH directory.

## Windows 

To get it running on windows, some special things should be noted:

Scheduler config must be updated to launch scripts from powershell. Add this section to `config.json`:

```
  "scheduler": {
    "maxParallel": 4,
    "source_cmd": "C:\\Projects\\eagle_eye\\eagle_eye_p3\\Scripts\\activate.ps1",
    "command": "powershell.exe"
  }
```

Also make sure to add PYTHONPATH and EAGLE_EYE_PATH to your Env. 

Lastly, torch and torchvision must be installed according to pytorch.org. `pip install torch===1.6.0 torchvision===0.7.0 -f https://download.pytorch.org/whl/torch_stable.html`

## Node

- `curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash -`
- `sudo apt install -y nodejs npm`
- `sudo npm install npm@latest -g`  # Updates npm to a version that is compatible with the newest NodeJS version.
- `sudo npm install -g yarn`


## Postgres

- `sudo apt-get install postgresql postgresql-contrib`
- `sudo /etc/init.d/postgresql start`
- `sudo update-rc.d postgresql enable`  # Enables automatic postgres launch on startup.
- `sudo -i -u postgres`
- `psql`
- `CREATE ROLE username WITH LOGIN;`  # Replace the word "**username**" with your actual linux username.
- `\password username;`  # Replace the word "**username**" with your actual linux username.
- `CREATE DATABASE eagle_eye;`
- `GRANT ALL PRIVILEGES ON DATABASE eagle_eye TO username;`  # Replace the word "**username**" with your actual linux username.
- `\q`
- `exit`
- cd `$EAGLE_EYE_PATH/install`
- `psql -d eagle_eye < 0-postgres_init.sql`
- `psql -d eagle_eye < 1-migration.sql`
- (if there are any addition x-migration.sql files, then also perform the same commands for them as above in a CONESECUTIVE order (based on their numbers)).
- `vim $EAGLE_EYE_PATH/config.json`  # Update this config.json file with the **username** and password that you set in the previous steps.


Your postgres database is now installed, and your Linux user account has been given the necessary rights to communicate with the eagle_eye Postgres database.

We also created one test-user for the Eagle Eye platform. The username is: temp@dontuse.nl, and its password is: much0sgr4cias.


## Backend

Steps to install the backend:
- `cd $EAGLE_EYE_PATH/backend/`
- `yarn`
- `node src/scripts/getEelibToken.js`
- insert the token into config.json

You can start the backend by running `node index.js` in the backend directory.


## Frontend

Install the frontend with:
- `cd $EAGLE_EYE_PATH/frontend/`
- `vim .env`  # Edit the file so the frontend points to your backend, see [1] or [2] below.
- `yarn`

You can start the frontend by running `yarn start` in the frontend directory.

If `yarn start` causes an error, read the error message and delete (`rm -rf`) the package in question (likely eslint and/or babel-eslint).


[1] If using nginx (installation instructions for nginx can be found below in the 'Production' section):

```
REACT_APP_HOST_LOCATION='https://localhost/api'
```
If https does not work, just change the url to use http instead.


[2] If not using nginx:

```
REACT_APP_HOST_LOCATION='http://localhost:3333'
```

## IMPORTANT
To use the Eagle Eye platform **locally**, you need to install a CORS plugin, and activate it on your locally hosted Eagle Eye website.

Working Firefox CORS plugin: https://addons.mozilla.org/nl/firefox/addon/cors-everywhere
Working Chrome CORS plugin: https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino


## Jupyter Notebook

To work with Jupyter Notebook, you can run the following command:

- `start_jupyter_bg.bash`

Jupyter Notebook now runs on port 8888, and its output is logged to the file `jupyter_notebook.log`. From this file, you can also get the token-code to login into the Jupter Notebook. When rebooting, Jupyter Notebook will not auto-restart, so it should be restated manually with the command above.


## Mock data

If you want some mock data, please refer to install/dev_mock_data/README.md


## Public dataset installation

### Fudan
- Download Fudan: https://www.icloud.com/iclouddrive/0paT6JjjRo-hqgzwLbGvWv6aw#data_folders_fudan
- Run ingest script, for example: python install/ingest/ingest_fudan.py --folder  /home/joeri/eagle_eye/Fudan/ --distance 5 --skip_between True

### ShanghaiTech

- Download ShanghaiTech dataset. 
- Unzip into directory `$EAGLE_EYE_PATH/files/public_datasets/ShanghaiTech_Crowd_Counting_Dataset/`
- Check if part_A_final and part_B_final are both present in above directory
- Run `$EAGLE_EYE_PATH/install/ingest/ingest_shanghaitech.py`


### Garbage Object Recognition Dataset

Download from https://drive.google.com/drive/folders/1nCiBS0lir6FBou3d_PkuXR6Bd_Y5RyNx

- move images from the data folder and move into `$EAGLE_EYE_PATH/files/public_datasets/GarbageDataset/images`
- move labels from the data folder and move into `$EAGLE_EYE_PATH/files/public_datasets/GarbageDataset/labels`
- move weights/garb.weights into `$EAGLE_EYE_PATH/files/model/garb.weights`
- move cfg folder into `$EAGLE_EYE_PATH/files/public_datasets/GarbageDataset/cfg`
- Run `python install/ingest/ingest_garbage.py`

### Line of interest setup

- run `python install/ingest/download_and_ingest_loi_models.py`


## Production Setup

- On the production server, the Eagle Eye project code/repo is usually deployed under `/opt/eagle_eye`.
- The `files` project directory should be setup so it links to `/mnt/raid1/eagle_eye`.

Steps to finalize the production setup:

### Nginx

- Install and start nginx:
    - `sudo apt install nginx`
    - `service nginx start`
- Configure nginx:
    - `cd $EAGLE_EYE_PATH/install/ubuntu/nginx/`
    - `bash ./create-dhparam.sh`
    - `bash ./create-selfsigned-cert.sh`
    - `sudo cp eagle-eye.conf /etc/nginx/conf.d/eagle-eye.conf`
- Restart nginx:
    - `service nginx restart`
- Make ngnix auto-start after reboot:
    - `sudo systemctl enable nginx.service`

For https, please follow this guide to create keys and certificates: https://www.digitalocean.com/community/tutorials/how-to-create-a-self-signed-ssl-certificate-for-nginx-on-centos-7


### Remote access

If you want to host postgres somewhere else or enable remote access:

Edit `postgresql.conf`

```
listen_address = '*'
```

Edit `pg_hba.conf` and add at the end:

```
host  all  all 0.0.0.0/0 md5
```

Restart with `systemctl restart postgresql`


### Iptables

Configure firewall to only allow ssh, http and https:

`sudo sh install/ubuntu/iptables/iptables-conf.sh`

Note: This will erase all your current rules.
