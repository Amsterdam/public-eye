import argparse
import signal
import os
import uuid
import math
import sys
import random
from matplotlib import pyplot as plt
from glob import glob
from eelib.websocket import send_websocket_message
import eelib.ml_line_crossing_density.utils as utils
import eelib.postgres as pg
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torchvision.utils import save_image
import eelib.store as store
from eelib.ml_line_crossing_density.dataset import SimpleDataset
from eelib.ml_line_crossing_density.models import (
    P2Small, P21Small, P33Small, P43Small, P632Small, P72Small, Baseline21
)
from eelib.ml_line_crossing_density.datasets import (
    fudan, ucsdpeds, dam, aicity, tub
)
import eelib.ml_line_crossing_density.losses as losses
from eelib.ml_line_crossing_density.model_csrnet import CSRNet
from eelib.ml_line_crossing_density.dataset import load_all_pairs_from_db

print("Model training")
print("Input: {}".format(str(sys.argv)))

parser = argparse.ArgumentParser(description='CrowdCounting (PWCNet backbone)')

pg.connect()
abort_run = False


def signal_handler(sig, frame):
    global abort_run
    abort_run = True


def save_checkpoint(state, filename=None):
    file_name = (
        filename
        or os.environ['EAGLE_EYE_PATH'] +
        '/files/models/{}.pth.tar'.format(uuid.uuid4())
    )
    torch.save(state, file_name)
    return file_name


def save_sample(args, dir, info, density, true, img, flow):
    save_image(img, '{}/{}/img.png'.format(dir, args['save_dir']))
    save_image(true / true.max(), '{}/{}/true.png'.format(dir, args['save_dir']))
    save_image(density / density.max(), '{}/{}/pred_{}.png'.format(
        dir, args['save_dir'], info))
    if flow is not None:
        plt.imsave('{}/{}/flow_{}.png'.format(
            dir, args['save_dir'], info), flow)


def load_train_dataset(args):
    splits = [[] for _ in range(args['train_split'])]
    pairs = load_all_pairs_from_db(args['dataset'])
    total_num = len(pairs)
    random.shuffle(pairs)
    for i, v in enumerate(pairs):
        splits[i % args['train_split']].append(v)

    print("Total frames loaded:", total_num)
    return splits


def setup_train_cross_dataset(splits, epoch, args):
    test_th = epoch % len(splits)
    train_pairs = []
    cross_pairs = splits[test_th]
    for i, split in enumerate(splits):
        if i == test_th:
            continue
        train_pairs += split

    if len(train_pairs) > args['train_amount']:
        train_pairs = random.sample(train_pairs, args['train_amount'])

    if len(cross_pairs) > args['cross_val_amount']:
        cross_pairs = random.sample(cross_pairs, args['cross_val_amount'])

    return (SimpleDataset(train_pairs, args, True),
            SimpleDataset(cross_pairs, args, False))


def load_test_dataset(args):
    test_vids = []
    cross_vids = []

    if args.dataset == 'fudan':
        for video_path in glob('data/Fudan/test_data/*/'):
            test_vids.append(fudan.load_video(video_path))
            cross_vids.append(fudan.load_video(video_path))
    elif args.dataset == 'ucsd':
        videos = ucsdpeds.load_videos('data/ucsdpeds')
        # Cross Improve!!
        cross_vids = videos[:3] + videos[7:10]
        test_vids = videos[:3] + videos[7:10]
    elif args.dataset == 'dam':
        # Single test video
        video = dam.load_test_video('data/Dam/test_arena2')
        cross_vids = [video]
        test_vids = [video]
    elif args.dataset == 'aicity':
        _, test_videos = aicity.split_train_test(
            aicity.load_all_videos('data/AICity'), train=0.5)
        cross_vids = test_videos
        test_vids = test_videos
    elif args.dataset == 'tub':
        _, rest, _ = tub.train_val_test_split(
            tub.load_all_videos('data/TUBCrowdFlow'), 0.1, 0.1)
        cross_vids = rest
        test_vids = rest
        # cross_vids, test_vids = tub.split_train_test(rest, 0.5)
    else:
        print("No valid dataset selected!!!!")
        exit()

    return cross_vids, test_vids


def load_model(args):
    # need to get pretrained to work
    model = None
    if args['model'] == 'p2small':
        model = P2Small(load_pretrained=True).cuda()
    elif args['model'] == 'p21small':
        model = P21Small(load_pretrained=True).cuda()
    elif args['model'] == 'p33small':
        model = P33Small(load_pretrained=True).cuda()
    elif args['model'] == 'p43small':
        model = P43Small(load_pretrained=True).cuda()
    elif args['model'] == 'p632small':
        model = P632Small(load_pretrained=True).cuda()
    elif args['model'] == 'p72small':
        model = P72Small(load_pretrained=True).cuda()
    elif args['model'] == 'baseline21':
        model = Baseline21(load_pretrained=True).cuda()
    elif args['model'] == 'csrnet':
        model = CSRNet().cuda()
        args['loss_focus'] = 'cc'
    else:
        print("Error! Incorrect model selected")
        exit()

    if args.get('pre'):
        print("Load pretrained model:", args.pre)
        model.load_state_dict(torch.load(args.pre))

    model.train()

    return model


def train(model, args):
    print('Initializing result storage...')
    print('Initializing dataset...')
    train_pair_splits = load_train_dataset(args)

    # Get the loss function for the density map decoder
    if args['loss_function'] == 'L1':
        criterion = nn.L1Loss(reduction='sum').cuda()
    elif args['loss_function'] == 'L2':
        criterion = nn.MSELoss(reduction='sum').cuda()
    else:
        print("Error, no correct loss function")
        exit()

    # Get the optimizer and step learner
    if args['optimizer'] == 'adam':
        if args['lr_setting'] == 'adam_2':
            optimizer = optim.Adam(
                model.parameters(), lr=2e-5, weight_decay=1e-4)
        elif args['lr_setting'] == 'adam_9':
            # Used for final results
            ret_params = []
            for name, params in model.named_parameters():
                if name.split('.')[0] == 'frontend_feat':
                    ret_params.append({'params': params, 'lr': 1e-5})
                elif name.split('.')[0] == 'fe_net':
                    ret_params.append({'params': params, 'lr': 4e-5})
                else:
                    ret_params.append({'params': params, 'lr': 1e-4})

            optimizer = optim.Adam(ret_params, lr=2e-5, weight_decay=1e-4)
    else:
        optimizer = optim.SGD(
            model.parameters(), 1e-5, momentum=0.95, weight_decay=5*1e-4)

    if args['lr_setting'] == 'adam_9':
        optim_lr_decay = torch.optim.lr_scheduler.StepLR(
            optimizer, step_size=int(args['epochs']/14), gamma=0.7)
    else:
        optim_lr_decay = torch.optim.lr_scheduler.StepLR(
            optimizer, step_size=1000, gamma=0.5)

    best_mae = None
    best_mse = None
    best_loss = None
    print('Start training...')
    # if program is interupted save the current model
    signal.signal(signal.SIGINT, signal_handler)

    with open(args['log_file_path'], 'w') as log_file:
        log_file.write("mae,rmse,loss")

    for epoch in range(args['epochs']):
        if abort_run:
            print('Canceling the train run')
            break

        train_dataset, test_dataset = setup_train_cross_dataset(
            train_pair_splits, epoch, args)
        train_loader = torch.utils.data.DataLoader(
            train_dataset, batch_size=args['batch_size'], shuffle=True,
            num_workers=args['dataloader_workers'])

        loss_container = utils.AverageContainer()
        for i, batch in enumerate(train_loader):
            frames1, frames2, densities, densities2 = batch
            frames1 = frames1.cuda()
            frames2 = frames2.cuda()
            densities = densities.cuda()
            densities2 = densities2.cuda()

            # Set grad to zero
            optimizer.zero_grad()

            # Run model and optimize (@TODO: Turn CSRNet in seperate
            # model predicting both flow and density)
            if args['model'] == 'csrnet':
                pred_densities = model(frames1)
                flow_fw = None
                flow_bw = None
            else:
                # Rest of the models
                flow_fw, flow_bw, pred_densities = model(frames1, frames2)

            # Resizing back to original sizes
            factor = (densities.shape[2] * densities.shape[3]) / (
                pred_densities.shape[2] * pred_densities.shape[3])

            # Check resize factor
            if epoch == 0 and i == 0:
                print("Resize factor: {}".format(factor))

            pred_densities = F.interpolate(
                input=pred_densities,
                size=(densities.shape[2], densities.shape[3]),
                mode=args['resize_mode'], align_corners=False) / factor

            if args['loss_focus'] != 'cc':
                # Creating loss for optical flow!
                photo_losses = losses.create_photometric_losses(
                    frames1, frames2, flow_fw, flow_bw)
                fe_loss = photo_losses['abs_robust_mean']['no_occlusion']

                loss_container['abs_no_occlusion'].update(
                    photo_losses['abs_robust_mean']['no_occlusion'].item())
                loss_container['abs_occlusion'].update(
                    photo_losses['abs_robust_mean']['occlusion'].item())
                loss_container['census_no_occlusion'].update(
                    photo_losses['census']['no_occlusion'].item())
                loss_container['census_occlusion'].update(
                    photo_losses['census']['occlusion'].item())
                loss_container['fe_loss'].update(fe_loss.item())

            if args['loss_focus'] != 'fe':
                if pred_densities.shape[1] == 2:
                    loss_densities = torch.cat([densities, densities2], 1)
                else:
                    loss_densities = densities.repeat(
                        1, pred_densities.shape[1], 1, 1)

                # Just use this one
                cc_loss = criterion(pred_densities, loss_densities)
                loss_container['cc_loss'].update(cc_loss.item())

            if args['loss_focus'] == 'cc':
                loss = cc_loss * args.cc_weight
            elif args['loss_focus'] == 'fe':
                loss = fe_loss
            else:
                loss = fe_loss + cc_loss * args['cc_weight']

            loss_container['total_loss'].update(loss.item())

            # Update
            loss.backward()
            optimizer.step()

        # Run every x epochs a test run
        if epoch % args['test_epochs'] == args['test_epochs'] - 1:
            avg, avg_sq, avg_loss = test_run(args, epoch, test_dataset, model)

            with open(args['log_file_path'], 'a') as log_file:
                log_file.write(
                    f"\n{avg.avg},{math.pow(avg_sq.avg, 0.5)},{avg_loss.avg.item()}")

            websocket_data = {
                "row": {
                    'mae': avg.avg, 'rmse': math.pow(avg_sq.avg, 0.5),
                    'loss': avg_loss.avg.item()},
                "job_id": args['job_id']
            }
            send_websocket_message('chart-data', 'update', websocket_data)

            if best_loss is None or best_loss > avg_loss.avg:
                save_checkpoint(model, args['model_filename'])

                best_mae = avg.avg
                best_mse = avg_sq.avg
                best_loss = avg_loss.avg
                torch.save(model.state_dict(), format(args['model_filename']))
                print(f"----- NEW BEST!! -----, mae: {best_mae},\
                    mse: {best_mse}",)

        # Learning decay update
        optim_lr_decay.step()

    store.insert_score('mae', best_mae, args["run_id"])
    store.insert_score('rmse', math.pow(best_mse, 0.5), args["run_id"])

    return


def test_run(args, epoch, test_dataset, model, save=True):
    test_loader = torch.utils.data.DataLoader(
        test_dataset, batch_size=1, num_workers=args['dataloader_workers'])

    avg = utils.AverageMeter()
    avg_sq = utils.AverageMeter()
    avg_loss = utils.AverageMeter()

    truth = utils.AverageMeter()
    pred = utils.AverageMeter()

    if args['loss_function'] == 'L1':
        criterion = nn.L1Loss(reduction='sum').cuda()
    elif args['loss_function'] == 'L2':
        criterion = nn.MSELoss(reduction='sum').cuda()
    else:
        print("Error, no correct loss function")
        exit()

    model.eval()
    with torch.no_grad():
        for i, batch in enumerate(test_loader):
            frames1, frames2, densities, densities2 = batch
            frames1 = frames1.cuda()
            frames2 = frames2.cuda()
            densities = densities.cuda()

            if args['model'] == 'csrnet':
                pred_densities = model(frames1)
                flow_fw = None
            else:
                flow_fw, flow_bw, pred_densities = model(frames1, frames2)
                flow_fw = flow_fw.detach()
                flow_bw.detach()

            pred_densities = pred_densities.detach()

            factor = (densities.shape[2] * densities.shape[3]) / (
                    pred_densities.shape[2] * pred_densities.shape[3])
            pred_densities = F.interpolate(
                input=pred_densities,
                size=(densities.shape[2], densities.shape[3]),
                mode=args['resize_mode'], align_corners=False) / factor

            truth.update(densities.sum().item())
            pred.update(pred_densities.sum().item())

            avg.update(abs((pred_densities.sum() - densities.sum()).item()))
            avg_sq.update(
                torch.pow(pred_densities.sum() - densities.sum(), 2).item())
            avg_loss.update(criterion(pred_densities, densities))

            if i == 1 and save:
                if args['loss_focus'] != 'cc':
                    flow_fw = flow_fw.detach().cpu().numpy().transpose(0, 2, 3, 1)
                    rgb = utils.flo_to_color(flow_fw[0])
                else:
                    rgb = None

                if args['save_dir']:
                    save_sample(
                        args, 'results', epoch, pred_densities[0],
                        densities[0], frames1[0], rgb)

    print("--- TEST [MAE: {}, RMSE: {}, LOSS: {}]".format(
        avg.avg, math.pow(avg_sq.avg, 0.5), avg_loss.avg))
    model.train()

    return avg, avg_sq, avg_loss


# # Run LOI test
# def loi_test(args):
#     metrics = utils.AverageContainer()

#     if args['model'] == 'csrnet':
#         args['loss_focus'] = 'cc'

#     if args.pre == '':
#         args.pre = 'weights/{}/last_model.pt'.format(args['save_dir'])
#     model = load_model(args)
#     model.eval()

#     # Get a pretrained fixed model for the flow prediction
#     if args.loss_focus == 'cc':
#         fe_model = P21Small(load_pretrained=True).cuda()
#         if args.dataset == 'fudan':
#             pre_fe = '20201123_122014_dataset-fudan_model-p21small_density_model-fixed-8_cc_weight-50_frames_between-5_epochs-400_lr_setting-adam_9'
#         elif args.dataset == 'ucsd':
#             pre_fe = '20201013_193544_dataset-ucsd_model-v332dilation_cc_weight-50_frames_between-2_epochs-750_loss_focus-fe_lr_setting-adam_2_resize_mode-bilinear'
#         elif args.dataset == 'tub':
#             pre_fe = '20201125_152055_dataset-tub_model-p21small_density_model-fixed-5_cc_weight-50_frames_between-5_epochs-350_lr_setting-adam_9'
#         elif args.dataset == 'aicity':
#             pre_fe = '20201126_192730_dataset-aicity_model-p21small_density_model-fixed-5_cc_weight-50_frames_between-5_epochs-350_lr_setting-adam_9'
#         else:
#             print("This dataset doesnt have flow only results")
#             exit()

#         fe_model.load_state_dict(
#             torch.load('weights/{}/last_model.pt'.format(pre_fe))
#         )
#         fe_model.eval()

#     results = []

#     ucsd_total_count = [[], []]

#     with torch.no_grad():
#         # Right now on cross validation
#         _, test_vids = load_test_dataset(args)
#         for v_i, video in enumerate(test_vids):

#             vid_result = []
#             print("Video ({}): {}".format(v_i, video.get_path()))

#             if args.eval_method == 'roi':
#                 skip_inbetween = False
#             else:
#                 skip_inbetween = True

#             video.generate_frame_pairs(distance=args.frames_between, skip_inbetween=skip_inbetween)
#             dataset = SimpleDataset(video.get_frame_pairs(), args, False)
#             dataloader = torch.utils.data.DataLoader(dataset, batch_size=1, num_workers=args.dataloader_workers)

#             # ---- REMOVE WHEN DONE ---- #
#             if args.loi_flow_width:
#                 print("Loading flow")
#                 frames1, frames2, _ = next(iter(dataloader))
#                 frames1 = frames1.cuda()
#                 frames2 = frames2.cuda()
#                 fe_output, _, _ = fe_model.forward(frames1, frames2)
#                 fe_speed = torch.norm(fe_output, dim=1)

#                 threshold = 1.0
#                 fe_speed_high2 = fe_speed > threshold
#                 avg_speed = fe_speed[fe_speed_high2].sum()/fe_speed_high2.sum()

#                 if args.loi_flow_smoothing:
#                     loi_width = int((0.75 + avg_speed / 10 * 0.25) * args.loi_width)
#                 else:
#                     loi_width = int((avg_speed / 9) * args.loi_width)
#             else:
#                 loi_width = args.loi_width

#             # Sometimes a single line is required for all the information
#             if args.loi_level == 'moving_counting' or args.loi_level == 'take_image' or args.eval_method == 'roi' or len(video.get_lines()) == 0:
#                 line = basic_entities.BasicLineSample(video, (0,0), (100,150))
#                 line.set_crossed(1,1)
#                 lines = [line]
#                 real_line = False
#             else:
#                 lines = video.get_lines()
#                 real_line = True

#             for l_i, line in enumerate(lines):
#                 # Circumvent some bugs. When no pedestrians at all are present in the frame. Skip
#                 if line.get_crossed()[0] + line.get_crossed()[1] == 0:
#                     continue

#                 # Setup LOI
#                 image = video.get_frame(0).get_image()
#                 width, height = image.size
#                 image.close()
#                 point1, point2 = line.get_line()
#                 loi_model = loi.LOI_Calculator(point1, point2,
#                                                img_width=width, img_height=height,
#                                                crop_processing=True,
#                                                loi_version=args.loi_version, loi_width=loi_width,
#                                                loi_height=loi_width*args.loi_height)

#                 if args.loi_level != 'take_image':
#                     loi_model.create_regions()
#                 else:
#                     # Index of capture in the video
#                     capt = 0

#                 if args.dataset == 'aicity':
#                     roi = aicity.create_roi(video)


#                 per_frame = [[], []]
#                 crosses = line.get_crossed()

#                 pbar = tqdm(total=len(video.get_frame_pairs()))

#                 metrics['timing'].reset()
                
#                 for s_i, batch in enumerate(dataloader):
                    
#                     # Take 6 screens per video
#                     if args.loi_level == 'take_image':
#                         n_screens = len(video.get_frame_pairs())
#                         every_screen = math.ceil(n_screens / 6)
#                         if ((s_i+1)%every_screen) != 0:
#                             continue

#                     torch.cuda.empty_cache()
#                     timer = utils.sTimer("Full process time")

#                     frame_pair = video.get_frame_pairs()[s_i]
#                     print_i = '{:05d}'.format(s_i + 1)
#                     frames1, frames2, densities, densities2 = batch
#                     frames1 = loi_model.reshape_image(frames1.cuda())
#                     frames2 = loi_model.reshape_image(frames2.cuda())

#                     # Expand for CC only (CSRNet to optimize for real world applications)
#                     if args.loss_focus == 'cc':
#                         if args.model == 'csrnet':
#                             cc_output = model(frames1)
#                         else:
#                             _, _, cc_output = model.forward(frames1, frames2)

#                         fe_output, _, _ = fe_model.forward(frames1, frames2)
#                     else:
#                         fe_output, _, cc_output = model.forward(frames1, frames2)

#                     # Apply maxing!!!
#                     if args.loi_maxing == 1:
#                         if args.dataset == 'fudan':
#                             fe_output = get_max_surrounding(fe_output, surrounding=6, only_under=True,
#                                                             smaller_sides=True)
#                             fe_output = get_max_surrounding(fe_output, surrounding=6, only_under=True,
#                                                             smaller_sides=True)
#                             fe_output = get_max_surrounding(fe_output, surrounding=4, only_under=True,
#                                                             smaller_sides=False)
#                         elif args.dataset == 'tub':
#                             fe_output = get_max_surrounding(fe_output, surrounding=6, only_under=True,
#                                                             smaller_sides=True)
#                         elif args.dataset == 'ucsd':
#                             fe_output = get_max_surrounding(fe_output, surrounding=6, only_under=True,
#                                                             smaller_sides=True)
#                         elif args.dataset == 'aicity':
#                             fe_output = get_max_surrounding(fe_output, surrounding=6, only_under=False,
#                                                             smaller_sides=False)
#                             fe_output = get_max_surrounding(fe_output, surrounding=6, only_under=False,
#                                                             smaller_sides=False)
#                         else:
#                             print("No maxing exists for this dataset")
#                             exit()


#                     # Resize and save as numpy
#                     cc_output = loi_model.to_orig_size(cc_output)
#                     cc_output = cc_output.squeeze().squeeze()
#                     cc_output = cc_output.detach().cpu().data.numpy()
#                     fe_output = loi_model.to_orig_size(fe_output)
#                     fe_output = fe_output.squeeze().permute(1, 2, 0)
#                     fe_output = fe_output.detach().cpu().data.numpy()

#                     # If in take_image mode we only quickly take a picture of the results!!!
#                     # Move to utilities
#                     if args.loi_level == 'take_image':
#                         dir1 = 'full_imgs/{}/{}-{}/'.format(args.dataset, v_i, capt)
#                         capt = capt + 1
#                         back = '{}_m{}_{}_{}'.format(args.model, args.loi_maxing, args.frames_between, datetime.now().strftime("%Y%m%d_%H%M%S"))
#                         Path(dir1).mkdir(parents=True, exist_ok=True)

#                         img = Image.open(video.get_frame_pairs()[s_i].get_frames(1).get_image_path())
#                         img.save('{}orig2.jpg'.format(dir1))

#                         density = torch.FloatTensor(
#                             density_filter.gaussian_filter_fixed_density(video.get_frame_pairs()[s_i].get_frames(0), 8))
#                         density = density.numpy()
#                         cc_img = Image.fromarray(density * 255.0 / density.max())
#                         cc_img = cc_img.convert("L")
#                         cc_img.save('{}orig_cc.jpg'.format(dir1))

#                         img = Image.open(video.get_frame_pairs()[s_i].get_frames(0).get_image_path())
#                         cc = cc_output
#                         fe = fe_output

#                         img.save('{}orig.jpg'.format(dir1))

#                         cc_img = Image.fromarray(cc_output * 255.0 / cc_output.max())
#                         cc_img = cc_img.convert("L")
#                         cc_img.save('{}cc_{}.jpg'.format(dir1, back))

#                         fe_img = Image.fromarray(np.uint8(utils.flo_to_color(fe)), mode='RGB')
#                         fe_img.save('{}fe_{}.jpg'.format(dir1, back))

#                         cc_img = cc_img.convert('RGB')
#                         blended = Image.blend(cc_img, fe_img, alpha=0.25)
#                         blended.save('{}blend_{}.jpg'.format(dir1, back))
#                         continue

#                     # Apply ROI's before calculating LOI
#                     if args.dataset == 'aicity':
#                         cc_output = np.multiply(roi, cc_output)
#                         densities = np.multiply(roi, densities)

#                     # Extract LOI results
#                     if args.loi_level == 'pixel':
#                         loi_results = loi_model.pixelwise_forward(cc_output, fe_output)
#                     elif args.loi_level == 'region':
#                         loi_results = loi_model.regionwise_forward(cc_output, fe_output)
#                     elif args.loi_level == 'crossed':
#                         loi_results = loi_model.cross_pixelwise_forward(cc_output, fe_output)
#                     elif args.loi_level == 'moving_counting':
#                         loi_results = ([0], [0])
#                         if args.dataset == 'tub':
#                             minimum_move = 3
#                         elif args.dataset == 'aicity':
#                             minimum_move = 6
#                         else:
#                             print('This dataset doesnt work with moving counting')
#                             exit()

#                         minimum_fe = np.linalg.norm(fe_output, axis=2) > minimum_move
#                         moving_density = np.multiply(minimum_fe, cc_output)

#                         metrics['m_mae'].update(abs(moving_density.sum() - len(frame_pair.get_frames(0).get_centers(only_moving=True))))
#                         metrics['m_mse'].update(math.pow(moving_density.sum() - len(frame_pair.get_frames(0).get_centers(only_moving=True)), 2))
#                     else:
#                         print('Incorrect LOI level')
#                         exit()
                    
#                     # Keep the time and save it
#                     if s_i > 0:
#                         metrics['timing'].update(timer.show(False))

#                     # ROI information should be saved once per video
#                     if l_i == 0:
#                         # Based on densities, but due errors these can be of
#                         metrics['old_roi_mae'].update(abs((cc_output.sum() - densities.sum()).item()))
#                         metrics['old_roi_mse'].update(torch.pow(cc_output.sum() - densities.sum(), 2).item())

#                         # Comparing with the real numbers is better for real world applications, but often worse performance
#                         metrics['real_roi_mae'].update(abs(cc_output.sum().item() - len(frame_pair.get_frames(0).get_centers())))
#                         metrics['real_roi_mse'].update(math.pow(cc_output.sum().item() - len(frame_pair.get_frames(0).get_centers()), 2))

#                     # @TODO: Fix this to get all totals work like this
#                     ucsd_total_count[0].append(sum(loi_results[0]))
#                     ucsd_total_count[1].append(sum(loi_results[1]))
#                     per_frame[0].append(sum(loi_results[0]))
#                     per_frame[1].append(sum(loi_results[1]))

#                     # Update GUI
#                     pbar.set_description('{} ({}), {} ({})'.format(sum(per_frame[0]), crosses[0], sum(per_frame[1]), crosses[1]))
#                     pbar.update(1)


#                     # Another video saver, which one to use and which not??
#                     if v_i == 0 and l_i == 0:
#                         if s_i < 10:
#                             img = Image.open(video.get_frame_pairs()[s_i].get_frames(0).get_image_path())

#                             utils.save_loi_sample("{}_{}_{}".format(v_i, l_i, s_i), img, cc_output, fe_output)


#                 pbar.close()

#                 # Non-real line is important for ROI counting, but not LOI counting
#                 if not real_line:
#                     break

#                 # Last frame is skipped, because we can't predict the one, so fix
#                 # @TODO fix the UCSD dataset and merge afterwards
#                 ucsd_total_count[0].append(0.0)
#                 ucsd_total_count[1].append(0.0)
#                 per_frame[0].append(0.0)
#                 per_frame[1].append(0.0)

#                 print("Timing {}".format(metrics['timing'].avg))

#                 # truth and predicted for evaluating all metrics
#                 t_left, t_right = crosses
#                 p_left, p_right = (sum(per_frame[0]), sum(per_frame[1]))

#                 mae = abs(t_left - p_left) + abs(t_right - p_right)
#                 metrics['loi_mae'].update(mae)

#                 mse = math.pow(t_left - p_left, 2) + math.pow(t_right - p_right, 2)
#                 metrics['loi_mse'].update(mse)

#                 percentual_total_mae = (p_left + p_right) / (t_left + t_right)
#                 metrics['loi_ptmae'].update(percentual_total_mae)

#                 relative_mae = mae / (t_left + t_right)
#                 metrics['loi_mape'].update(relative_mae)

#                 print("LOI performance (MAE: {}, RMSE: {}, MAPE: {})".format(mae, math.sqrt(mse), relative_mae))


#                 results.append({
#                     'vid': v_i,
#                     'loi': l_i,
#                     'mae': mae,
#                     'mse': mse,
#                     'ptmae': percentual_total_mae,
#                     'rmae': relative_mae
#                 })

#                 # @TODO Do this in general!! Not only for Dam, because these results are interesting to compare
#                 if args.dataset == 'dam':
#                     results = {'per_frame': per_frame}

#                     with open('dam_results_{}_{}.json'.format(v_i, l_i), 'w') as outfile:
#                         json.dump(results, outfile)

#         if args.loi_level == 'take_image':
#             return

#         # @TODO Move this to utils!!
#         if args.dataset == 'ucsd':
#             ucsd_total_gt = ucsdpeds.load_countings('data/ucsdpeds')
#             ucsd_total_count2 = ucsd_total_count
#             ucsd_total_count = [[], []]

#             for i in range(len(ucsd_total_count2[0])):
#                 for _ in range(args.frames_between):
#                     ucsd_total_count[0].append(ucsd_total_count2[0][i] / args.frames_between)
#                     ucsd_total_count[1].append(ucsd_total_count2[1][i] / args.frames_between)

#             wmae = [[], []]
#             tmae = [[], []]
#             imae = [[], []]

#             for i, _ in enumerate(ucsd_total_count[0]):
#                 imae[0].append(abs(ucsd_total_count[0][i] - ucsd_total_gt[0][i]))
#                 imae[1].append(abs(ucsd_total_count[1][i] - ucsd_total_gt[1][i]))

#                 if i >= 600:
#                     tmae[0].append(abs(sum(ucsd_total_count[0][600:i + 1]) - sum(ucsd_total_gt[0][600:i + 1])))
#                     tmae[1].append(abs(sum(ucsd_total_count[1][600:i + 1]) - sum(ucsd_total_gt[1][600:i + 1])))

#                     if i + 100 < 1200:
#                         wmae[0].append(abs(sum(ucsd_total_count[0][i:i + 100]) - sum(ucsd_total_gt[0][i:i + 100])))
#                         wmae[1].append(abs(sum(ucsd_total_count[1][i:i + 100]) - sum(ucsd_total_gt[1][i:i + 100])))
#                 else:
#                     tmae[0].append(abs(sum(ucsd_total_count[0][:i + 1]) - sum(ucsd_total_gt[0][:i + 1])))
#                     tmae[1].append(abs(sum(ucsd_total_count[1][:i + 1]) - sum(ucsd_total_gt[1][:i + 1])))

#                     if i+100 < 600:
#                         wmae[0].append(abs(sum(ucsd_total_count[0][i:i + 100]) - sum(ucsd_total_gt[0][i:i + 100])))
#                         wmae[1].append(abs(sum(ucsd_total_count[1][i:i + 100]) - sum(ucsd_total_gt[1][i:i + 100])))



#             print("UCSD results, total error left: {}, right: {}".format(abs(sum(ucsd_total_count[0]) - sum(ucsd_total_gt[0])), abs(sum(ucsd_total_count[1]) - sum(ucsd_total_gt[1]))))
#             print("IMAE: {} | {}".format(sum(imae[0]) / len(imae[0]), sum(imae[1]) / len(imae[1])))
#             print("TMAE: {} | {}".format(sum(tmae[0]) / len(tmae[0]), sum(tmae[1]) / len(tmae[1])))
#             print("WMAE: {} | {}".format(sum(wmae[0]) / len(wmae[0]), sum(wmae[1]) / len(wmae[1])))
#         # END of UCSD special testing


#         # Save all results. Some won't work per time, but are then often 0.
#         # @TODO add in README which results are when valid
#         results = {
#             'loi_mae': metrics['loi_mae'].avg,
#             'loi_mse': metrics['loi_mse'].avg,
#             'loi_rmae': metrics['loi_rmae'].avg,
#             'loi_ptmae': metrics['loi_ptmae'].avg,
#             'loi_mape': metrics['loi_mape'].avg,
#             'old_roi_mae': metrics['old_roi_mae'].avg,
#             'old_roi_mse': metrics['old_roi_mse'].avg,
#             'real_roi_mae': metrics['real_roi_mae'].avg,
#             'real_roi_mse': metrics['real_roi_mse'].avg,
#             'moving_mae': metrics['m_mae'].avg,
#             'moving_mse': metrics['m_mse'].avg,
#             'timing': metrics['timing'].avg,
#             'per_vid': results
#         }
#         outname = 'new_{}_{}_{}_{}_{}_{}'.format(args.dataset, args.model, args.eval_method, args.loi_level, args.loi_maxing, datetime.now().strftime("%Y%m%d_%H%M%S"))
#         with open('loi_results/{}.json'.format(outname), 'w') as outfile:
#             json.dump(results, outfile)

#         # Print simple results
#         print("MAE: {}, MSE: {}, MAPE: {}".format(metrics['loi_mae'].avg,
#                                                    metrics['loi_mse'].avg,
#                                                    metrics['loi_mape'].avg))

#         return results