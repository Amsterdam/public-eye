import wget
import os
import eelib.store as store


store.connect()
url = 'https://dl.fbaipublicfiles.com/deit/deit_small_distilled_patch16_224-649709d9.pth'
output_file = os.path.join(
    os.environ['EAGLE_EYE_PATH'],
    'files',
    'models',
    'deit_small_distilled_patch16_224-649709d9.pth')

wget.download(url, output_file)
nn = store.get_neural_network_by_script("train_vicct.py")
store.insert_model("deit_small_distilled_patch16_224", nn.id, output_file)
