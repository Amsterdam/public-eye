import eelib.stream.global_variables as global_variables
from eelib.ml_line_crossing_density.loi import LOI_Calculator
import PIL.Image as Image
import torch
import math
import numpy as np
from eelib.stream.stream_utils import (
    rescale_output,
    draw_on_output,
    concat_heatmap_to_output,
    stop_stream,
    output_consumer_loop,
    get_argument,
    set_selected_gpu
)
from eelib.ml.average_meter import AverageMeter


### LINE CROSSING DENSITY ###
######## START ##############

#### Smooth the surroundings for Flow Estimation ####
# Due to the use of 2D conv to do one sample at the time which is easy
# Update could handle multiple frames at the time
#
# Surrounding: Pixels around each pixel to look for the max
# only_under removes the search in top side of the pixel
# Smaller_sides: When only_under the width search will be as wide as the height (surrounding+1)

# @TODO: How exactly do we create a correct payload?
@output_consumer_loop
def output_consumer_thread_lc_density(
    outputq,
    framewriteq,
    stream_server,
    arguments,
    on_predict_callback=None,
) -> bool:
    data = outputq.get(block=True)
    if data is None or global_variables.g_run_capture is False:
        return False

    image = data['image']
    # image_with_mask = data['image_with_mask']
    count = data['count']

    output = image
    output = np.array(draw_on_output(
        output,
        "Cnt: {} || {}".format(
            int(round(count[0])), int(round(count[1]))),
        data['points']
    ))
    output = np.array(
        concat_heatmap_to_output(output, data['density_map'], data['flow_map'])
    )
    output_scale_factor = get_argument(
        data['stream_index'], 'output_scale_factor', arguments)
    output = (
        output if not output_scale_factor
        else rescale_output(
            output, output_scale_factor)
    )
    stream_server.push_image(output)

    print('written ({} items left)'.format(outputq.qsize()))
    return True


def get_max_surrounding(
    data,
    surrounding=1,
    only_under=True,
    smaller_sides=True
):
    kernel_size = surrounding * 2 + 1
    out_channels = np.eye(kernel_size * kernel_size)

    if only_under:
        out_channels = out_channels[surrounding * kernel_size:]
        if smaller_sides:
            for i in range(math.floor(surrounding/2)):
                out_channels[
                    list(range(i, len(out_channels), kernel_size))] = False
                out_channels[
                    list(range(
                        kernel_size - i - 1, len(out_channels), kernel_size))
                ] = False

    w = out_channels.reshape(
        (out_channels.shape[0], 1, kernel_size, kernel_size))
    w = torch.tensor(w, dtype=torch.float).cuda()

    data = data.transpose(0, 1).cuda()
    patches = torch.nn.functional.conv2d(
        data,
        w,
        padding=(surrounding, surrounding)
    )[:, :, :data.shape[2], :data.shape[3]]

    speed = torch.sqrt(torch.sum(torch.pow(patches, 2), axis=0))
    max_speeds = torch.argmax(speed, axis=0)
    gather_speeds = max_speeds.unsqueeze(0).unsqueeze(0).repeat(2, 1, 1, 1)
    output = torch.gather(patches, 1, gather_speeds)
    output = output.transpose(0, 1)

    return output


def predict_line_crossing(
    image1,
    image2,
    network,
    transformFn,
    cuda,
    loi_models
):
    with torch.no_grad():
        # print("Reshape")
        frames1 = loi_models[0].reshape_image(
            transformFn(Image.fromarray(image1)).cuda().unsqueeze(0))
        frames2 = loi_models[0].reshape_image(
            transformFn(Image.fromarray(image2)).cuda().unsqueeze(0))

        # print("Model")
        fe_output, _, cc_output = network.forward(frames1, frames2)

        # print("Do maxing")
        fe_output = get_max_surrounding(
            fe_output,
            surrounding=4,
            only_under=False,
            smaller_sides=False)

        fe_output = get_max_surrounding(
            fe_output,
            surrounding=4,
            only_under=False,
            smaller_sides=False)

        # print("CC to orig")
        cc_output = loi_models[0].to_orig_size(cc_output)
        cc_output = cc_output.squeeze().squeeze()
        cc_output = cc_output.detach().cpu().data.numpy()

        # print("Flow to orig")
        fe_output = loi_models[0].to_orig_size(fe_output)
        fe_output = fe_output.squeeze().permute(1, 2, 0)
        fe_output = fe_output.detach().cpu().data.numpy()

        # print("LOI")
        count = [0.0, 0.0]
        for loi_model in loi_models:
            loi_results = loi_model.pixelwise_forward(cc_output, fe_output)

            # Swap because of inconsistency in pixelwise forward
            # @TODO Return direct for much more refined control
            count[0] = count[0] + sum(loi_results[1])
            count[1] = count[1] + sum(loi_results[0])

    return count, cc_output, fe_output


def predict_consumer_thread_lc_density(
    predictq,
    outputq,
    transformFn,
    arguments,
    get_model
):
    try:
        predictions1 = AverageMeter()
        predictions2 = AverageMeter()

        loi_width = 20

        print("Start predictor LOI")

        # Need 2 frames
        prev_data = None
        points = []
        while global_variables.g_run_capture:
            data = predictq.get(block=True)
            if data is None or global_variables.g_run_capture is False:
                print("stop predict consumer thread")
                outputq.put_nowait(None)
                break

            print(data['frame_num'])
            # initialize       
            if data['frame_num'] == 0:
                print("Initialize LOI")
                set_selected_gpu(
                    get_argument(data['stream_index'], 'selected_gpu', arguments),
                    get_argument(data['stream_index'], 'cuda', arguments))

                points = get_argument(
                    data['stream_index'], 'loi_points', arguments)

                stream_image_height, stream_image_width, _ = data['frame'].shape

                loi_models = []
                for line_points in points:
                    point1 = (
                        int(line_points[0][0]*stream_image_width),
                        int(line_points[0][1]*stream_image_height)
                    )
                    point2 = (
                        int(line_points[1][0]*stream_image_width),
                        int(line_points[1][1]*stream_image_height)
                    )

                    loi_model = LOI_Calculator(
                        point1,
                        point2,
                        stream_image_width,
                        stream_image_height,
                        # No cropping, but very inefficient
                        crop_processing=False,
                        loi_width=loi_width)
                    loi_model.create_regions()
                    loi_models.append(loi_model)

                if len(loi_models) == 0:
                    raise Exception("No LOI models were generated,\
                        at least 1 needs to be present")

                prev_data = data

                print("Done initializing LOI")

                continue

            model = get_model(data['stream_index'])
            count, dens_map, flow_map = predict_line_crossing(
                prev_data['frame'], data['frame'],
                model,
                transformFn,
                get_argument(data['stream_index'], 'cuda', arguments),
                loi_models)

            predictions1.update(count[0])
            predictions2.update(count[1])

            print("predict {} -> {} ({})".format(
                prev_data['frame_num'],
                [
                    predictions1.sum,
                    predictions2.sum
                ],
                count))

            outputq.put_nowait({
                'frame_num': prev_data['frame_num'],
                'frame': prev_data['frame'],
                'image': prev_data['image'],
                'stream_name': prev_data['stream_name'],
                'count': [predictions1.sum, predictions2.sum],
                'density_map': dens_map,
                'flow_map': flow_map,
                'url': prev_data['url'],
                'model_name': prev_data['model_name'],
                'stream_index': prev_data['stream_index'],
                'points': points
            })

            prev_data = data
    except Exception as e:
        print("Exiting because of error predict thread:", e)
        stop_stream()
        outputq.put_nowait(None)
