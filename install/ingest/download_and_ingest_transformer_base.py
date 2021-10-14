import wget
import os
import eelib.store as store


store.connect()
url = 'https://dl.fbaipublicfiles.com/deit/deit_base_distilled_patch16_224-df68dfff.pth'
output_file = os.path.join(
    os.environ['EAGLE_EYE_PATH'],
    'files',
    'models',
    'deit_base_distilled_patch16_224-df68dfff.pth')

wget.download(url, output_file)
nn = store.get_neural_network_by_script("train_vicct.py")
store.insert_model("deit_base_distilled_patch16_224", nn.id, output_file)
