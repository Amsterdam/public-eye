from torchvision import transforms
import numpy as np

# ImageNet mean and std
standard_transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]),
    ])

no_transform = transforms.Compose([transforms.ToTensor()])

def image_to_numpy(im):
    return np.transpose(np.array(im), (1,0,2))

def get_normalization_values(im, div=255):
    npimage = image_to_numpy(im).T
   
    n_chs = len(im.getbands())
    
    means = []
    stds = []
    for ch in range(0, n_chs):
        means.append(np.mean(npimage[ch]) / div)
        stds.append(np.std(npimage[ch]) / div)
    
    return means, stds

def instance_normalization(im):
    means, stds = get_normalization_values(im)

    return transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(
            mean=means,
            std=stds),
        ])(im)