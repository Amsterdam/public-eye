import torch
import signal
import eelib.store as store
import os
import uuid
import json
import time
from eelib.websocket import send_websocket_message
from torch.autograd import Variable
from eelib.ml_density.dataset import listDataset
from eelib.ml_density.validate_network import validate
from eelib.ml_density.utils import save_checkpoint, load_model_from_checkpoint


def get_gts_and_frames_in_dataset(dataset_id):
    dataset = store.get_dataset_by_id(dataset_id)
    files = store.get_files_for_dataset(dataset)
    frame_paths = [file['frame']['path'] for file in files]
    gt_paths = [file['ground_truth']['path'] for file in files]
    return list(zip(frame_paths, gt_paths))


def get_lr(optimizer):
    for param_group in optimizer.param_groups:
        return param_group['lr']


abort_run = False


def signal_handler(sig, frame):
    global abort_run
    abort_run = True


def train(
    script_name,
    log_file_path,
    run_id,
    args,
    model,
    load_data,
    transform,
    criterion,
    optimizer,
    scheduler=None
):
    assert "train_dataset_id" in args, "No train_dataset_id in arguments"
    assert "val_dataset_id" in args, "No val_dataset_id in arguments"

    if "pretrained_model_path" in args:
        load_model_from_checkpoint(args["pretrained_model_path"], model)

    train_list = get_gts_and_frames_in_dataset(args['train_dataset_id'])
    val_list = get_gts_and_frames_in_dataset(args['val_dataset_id'])

    train_loader = torch.utils.data.DataLoader(
        listDataset(train_list,
                    load_data,
                    shuffle=True,
                    transform=transform,
                    train=True,
                    enhance=args['enhance'],
                    scale_factor=args['scale_factor'],
                    batch_size=args['batch_size'],
                    num_workers=args['workers']),
        batch_size=args['batch_size']
    )

    is_best = False
    best_prec1 = 1e6
    best_mse = 1e6

    neural_network = store.get_neural_network_by_script(script_name)
    model_filename = save_checkpoint({
        'epoch': 0,
        'arch': args.get('pre'),
        'state_dict': model.state_dict(),
        'best_prec1': best_prec1,
        'optimizer': optimizer.state_dict(),
        'scheduler': None if not scheduler else scheduler.state_dict()
    })

    config_path = os.environ['EAGLE_EYE_PATH'] + '/files/configs/{}.json'.format(uuid.uuid4())

    with open(config_path, 'w') as f:
        json.dump(args, f)

    config_id = store.insert_train_config(config_path)
    model_id = store.insert_model(args["model_name"], neural_network.id, model_filename)

    store.update_train_run(
        run_id,
        model_id,
        config_id
    )
    updated_training_run = store.get_train_run_by_id_as_dict(run_id)
    updated_training_run["date"] = updated_training_run["date"].isoformat()
    send_websocket_message('training-run', 'update', updated_training_run)

    with open(log_file_path, 'w') as log_file:
        log_file.write("mae,mse,loss")

    # if program is interupted save the current model
    signal.signal(signal.SIGINT, signal_handler)

    for epoch in range(args['epochs']):
        print('Abort run status', abort_run)
        if abort_run:
            print('Canceling the train run')
            break

        print('epoch {}, lr: {}'.format(epoch, get_lr(optimizer)))
        print("begin train")

        losses = AverageMeter()
        batch_time = AverageMeter()
        data_time = AverageMeter()

        print('epoch %d, processed %d samples' % (epoch, epoch * len(train_loader.dataset)))

        model.train()
        end = time.time()

        for i,(img, target)in enumerate(train_loader):
            if abort_run:
                print('Canceling the epoch')
                break

            data_time.update(time.time() - end)

            img = img.cuda()
            img = Variable(img)
            output = model(img)

            target = target.type(torch.FloatTensor).unsqueeze(0).cuda()
            target = Variable(target)
            target = target.transpose(1, 0)

            loss = criterion(output, target)
            losses.update(loss.item(), img.size(0))

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            batch_time.update(time.time() - end)
            end = time.time()

            if i % args['print_freq'] == 0:
                print('Epoch: [{0}][{1}/{2}]\t'
                    'Time {batch_time.val:.3f} ({batch_time.avg:.3f})\t'
                    'Data {data_time.val:.3f} ({data_time.avg:.3f})\t'
                    'Loss {loss.val:.4f} ({loss.avg:.4f})\t'
                    .format(
                    epoch, i, len(train_loader), batch_time=batch_time,
                    data_time=data_time, loss=losses))

            torch.cuda.empty_cache()

        prec1, mse = validate(val_list, model, transform, load_data, args['scale_factor'])

        if scheduler:
            scheduler.step()

        is_best = prec1 < best_prec1
        if is_best:
            best_model_filename = save_checkpoint({
                'epoch': epoch + 1,
                'arch': args.get('pre'),
                'state_dict': model.state_dict(),
                'best_prec1': best_prec1,
                'optimizer': optimizer.state_dict(),
                'scheduler': None if not scheduler else scheduler.state_dict()
            }, model_filename)

        with open(log_file_path, 'a') as log_file:
            log_file.write("\n{0},{1},{2}".format(prec1, mse, losses.avg))
            websocket_data = {
                "row": {'mae': prec1, 'mse': mse, 'loss': losses.avg},
                "job_id": updated_training_run["job_id"]
            }
            send_websocket_message('chart-data', 'update', websocket_data)

        best_prec1 = min(prec1, best_prec1)
        best_mse = min(best_mse, mse)
        print(' * best MAE {mae:.3f} '.format(mae=best_prec1))

    store.insert_score('mae', best_prec1, run_id)
    store.insert_score('mse', best_mse, run_id)


class AverageMeter(object):
    """Computes and stores the average and current value"""
    def __init__(self):
        self.reset()

    def reset(self):
        self.val = 0
        self.avg = 0
        self.sum = 0
        self.count = 0

    def update(self, val, n=1):
        self.val = val
        self.sum += val * n
        self.count += n
        self.avg = self.sum / self.count
