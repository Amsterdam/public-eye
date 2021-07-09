import wget
import os 
import zipfile
import eelib.store as store
import eelib.postgres as pg
pg.connect()


# url = 'http://www.y3k.de/downloads/p2_initial_models.zip'

# print("Starting download...")
# wget.download(url, "/tmp/")
# output_folder = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'models')

# print("Starting extraction...")
# with zipfile.ZipFile("/tmp/p2_initial_models.zip", 'r') as zip_ref:
#     zip_ref.extractall(output_folder)

# print("Deleting archive...")
# os.unlink("/tmp/p2_initial_models.zip")

# nn1 = store.get_neural_network_by_script("train_loi_density.py")
# store.insert_model("pretrained_loi1", nn1.id, output_folder + "/P21Small_last.pt")

# nn2 = store.get_neural_network_by_script("train_loi_density2.py")
# store.insert_model(
#     "pretrained_loi2", nn2.id, output_folder + "/P2Small_last.pt")

# pretrained requirement
network_chair_url = "http://content.sniklaus.com/github/pytorch-pwc/network-chairs-things.pytorch"
wget.download(network_chair_url, os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'models'))
