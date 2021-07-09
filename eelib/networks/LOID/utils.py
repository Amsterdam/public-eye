import h5py
import os
import torch
import shutil
import uuid

def save_net(fname, net):
    with h5py.File(fname, 'w') as h5f:
        for k, v in net.state_dict().items():
            h5f.create_dataset(k, data=v.cpu().numpy())

def load_net(fname, net):
    with h5py.File(fname, 'r') as h5f:
        for k, v in net.state_dict().items():        
            param = torch.from_numpy(np.asarray(h5f[k]))         
            v.copy_(param)
            
def save_checkpoint(state, is_best, task_id, filename='checkpoint.pth.tar'):
    file_name = os.environ['EAGLE_EYE_PATH'] + '/files/models/csrnet/{}.pth.tar'.format(uuid.uuid4())
    torch.save(state, file_name)
    return file_name

    # if is_best:
    #     shutil.copyfile(filename + str(task_id), 'files/models/model_best_{}.pth.tar'.format(task_id))
