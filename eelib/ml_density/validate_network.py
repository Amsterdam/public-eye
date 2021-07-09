import torch
from eelib.ml_density.dataset import listDataset
from torch.autograd import Variable
import numpy as np

def validate(val_list, model, transform, load_data, scale_factor=1.0):
    print ('begin test')
    test_loader = torch.utils.data.DataLoader(
        listDataset(val_list,
                    load_data,
                    shuffle=False,
                    transform=transform,
                    train=False,
                    scale_factor=scale_factor),
        batch_size=1
    )

    model.eval()
    mae = 0
    mse = 0

    with torch.no_grad():
        for img, target in test_loader:
            img = img.cuda()
            img = Variable(img)
            output = model(img)

            mae += abs(output.data.sum()-target.sum().type(torch.FloatTensor).cuda())
            mse += (output.data.sum()-target.sum().type(torch.FloatTensor).cuda()) ** 2

    mae = mae/len(test_loader)
    mse = torch.sqrt(mse/len(test_loader))
    print(' * MAE {mae:.3f} MSE {mse:.3f}'.format(mae=mae, mse=mse))

    return mae.item(), mse.item()
