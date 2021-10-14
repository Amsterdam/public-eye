# Few-shot crowd counting
## What is Crowd Counting?
As the name suggest, crowd counting involves estimating the number of people in a location. Most modern computer vision methods achieve this with density map regression. That is, given an image of a scene (for example, surveillance footage), predict a density map where each pixel indicated the accumalative density of all people at that point. The ground-truth density is often a Gaussian distribution around each person's head. If multiple persons are close to each other, the distributions overlap and the values are summed. We obtain the total count in a scene by integrating over the whole density map. The following shows an example of a scene, its ground-truth density map, and a model's prediction of this map, given only the image. Note that some of the density mass is outside the image frame due to the Gaussian distribution close to the edge of the image.

![Example of density map regression](./misc/example_images/density_example.jpg?raw=true "Example of density map regression")

## What is few-shot learning in the context of scene adaptation with crowd counting?
Few-shot learning means that the model must learn something with only a few training examples. Scene adaptation in crowd counting is that we have a model trained on one or more scens (e.g. one or more surveillance cameras), and that we wish to adjust the model to do crowd counting in a novel scene. Combine the two and you get that a model must adjust to a novel scene with just a few training examples. This is a non-trivial task due to the change in perspective, changes in lighting conditions, changes in people's appearance, changes in background, etc.


## Why do we need few-shot learning for scene adaptation?
The standard approach to obtain a model for a novel scene is to manually annotate many images of this scene, usually in the hundreds of images. This is extremely tedious and labour intensive. Should we succeed in obtaining a model that can adapt to new scenes with just a few images, we greatly reduce the required annotation time whenever we place a new camera.


# Content of this repository
This repository contains the code to train a regression DeiT model, both for normal learning and for meta-learning (basically two projects in one). For standard training, images are provided to the network with their GT values and the model is updates accordingly based on its error. For meta training, we feed images specific to a scene to a model and update it to obtain model-prime. This model-prime is evaluated on new images from the same scene. The loss of model-prime on these new images is backpropagated all the way to the original model. Hence, literally 'learning to learn'.

## Folder structure:
1) [`datasets`](./datasets): Dataloaders for specific datasets. \_DeiT indicates that the dataloader is for DeiT models, and \_CSRNet indicates that the dataloader is for CSRNet.
2) [`mini_experiments`](./mini_experiments): Just some quick hardcoded prototyping experiments. Will be replaced with formal notebooks later
3) [`mist`](./mist): Some utility functions and stuff for the GitHub page
4) [`models`](./models): Contains the model architectures, as well as wrappers for meta-learning models
5) [`notebooks`](./notebooks): Notebooks for quick prototyping, but also easy to read notebooks for functionalities such as testing pretrained models on the test set of a dataset.


## Using this repository:
[`environment.yml`](./environment.yml) contains the conda environment of this project. One can install this environment with 'conda env create -f environment.yml'.

Global parameters for a run are specified in [`config.py`](./config.py). Set these parameters accordingly when training a new model. For each dataset, specific settings for that dataset are specified in 'settings' in a [`datasets`](./datasets) sub-folder. Most importantly is 'cfg_data.DATA_PATH' that specifies where the dataset is located. Training a standard model is performed by running [`train_standard`](./train_standard). Training a model with meta-learning is performed by running [`train_meta`](./train_meta).



# Acknowledgements

The content of this repository is heavily inspired by the Crowd Counting Code Framework ([`C^3-Framework`](https://github.com/gjy3035/C-3-Framework)) with their corresponding [`paper`](https://arxiv.org/abs/1907.02724). In fact, this repository uses parts of their codebase!

I use [`CSRNet`](https://arxiv.org/abs/1802.10062) as a CNN-based model. I took code from [`this`](https://github.com/leeyeehoo/CSRNet-pytorch) repository to implement the model. 

The DeiT framework is from [`this`](https://arxiv.org/abs/2012.12877) paper. I use code from [` their repository`](https://github.com/facebookresearch/deit) to implement the models.






























<!--
# DEATH to the CNNs
The field of computer vision received a wild contribution from researches at Facebook, whom succeeded in training a fully transformer based architecture (DeiT) to do image classification on ImageNet. In this repository, I build upon their findings by adjusting their architecture to perform regression in the context of crowd counting. That is, I transform the embedding vectors from DeiT such that a density map can be constructed. Learning is then performed as usual. I can highly recommend [this](https://arxiv.org/abs/2012.12877) read.

Apart from a potential groundbreaking paper, the reptilian overlords of Facebook also blessed us peasants with several variants of their DeiT architecture, including the weights of the trained models and all code to evaluate and train the models. Hence, just like CSRNet and almost all architecures in crowd counting, we have a solid model that can be regarded as a 'general feature extractor'. Fine-tuning the weights of the model to do crowd counting can now be done in a day!

Preliminary results indicate that transformers have major potentials and that crowd counting competes with modern CNN methods. On some datasets, DeiT showed its superiority over CSRNet. On others it lost (just slightly) to CSRNet.

Since this is the first work to do regression in this way with transformers, I will perform extensive experiments to find what modifications work and which dont. Afterwards, I will use the best performing architecture as a baseline in my persuit of a 'general' model that can quickly adapt to novel scenes it has never seen before. For this, I plan to implement and test two so called '[meta-learning](https://lilianweng.github.io/lil-log/2018/11/30/meta-learning.html)' algorithms: 1) [MAML](https://arxiv.org/abs/1703.03400) and 2) [Meta-SGD](https://arxiv.org/abs/1707.09835)

I write these meta-learning algorithms is a general, model-agnostic, way, such that it is almost trivial to swap out DeiT for any deep learning crowd counting architecture. This, because there is still a possibility that DeiT shows major defects on some part later in my thesis. We can then change the architecture without much trouble for the practical viewpoint of this project.

The end goal of this project is to have one or more of the DeiT architectures that can readily adjust to new scenes with just 1 to 5 annotated examples of this scene.  

## Research questions and research directions

<p align="center"> <i> RQ 1: How can transformers be utilised to generate density maps of crowds in images? </i> </p> 

I plan to perform an ablation study with DeiT on the Shanghaitech part B dataset. With this I expect to find how to properly train a transformer-based crowd counting model. I also plan to extend these findings to the datasets of the Municipality, although that will probably not be part of my thesis.  

<p align="center"> <i> RQ 2: Do transformer-based models generalise better than CNN-based models? </i> </p> 

Zero-shot adaptation, or transfer learning, in which we use a model pretrained on some dataset on another dataset without fine-tuning. This result will be especially usefull for scenarios where we dont have the time or resources to train a new model (as we have already found that fine-tuning with limited data is not sufficient). So far, I did find some settings where DeiT provides far superior transfer learning performance. Can we maximize transfer-learning performance? When does it work better and when does it fail?

Furthermore, the holy grail would be a model so good that no fine-tuning is necessary for adequate performance. We know no existing method is able to provide this. Can transformers be the key to supremacy? It's a far stretch, but nevertheless interesting to see how far we can push DeiT.

<p align="center"> <i> RQ 3: Do transformer-based models provide better few-shot scene adaptation performance than CNN-based models? </i> </p> 

Using Meta-SGD or MAML, can we train a model that adapts better to unseen scenarios than standard pre-trained models? [one work](https://arxiv.org/pdf/2002.00264.pdf) did show very promosing results, although I failed to reproduce their work so far. I start to lose my trust in these methods, though it's the direction of my research and so I want to conclude formally how well these methods perform. Should these experiments prove fruitful, we would no longer be required to annotate 100+ images for each new camera we place.
-->
