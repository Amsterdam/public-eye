import numpy as np
import eelib.stream.global_variables as global_variables
from eelib.stream.stream_utils import (
    make_callback_payload,
    get_argument,
    draw_on_output,
    concat_heatmap_to_output,
    output_consumer_loop,
    rescale_output,
    set_selected_gpu,
    stop_stream
)
import PIL.Image as Image
import cv2
from eelib.ml.average_meter import AverageMeter
from eelib.ml.sliding_window import SlidingWindow
from eelib.ml.polygon_mask import polygon_mask


@output_consumer_loop
def output_consumer_thread_density(
    outputq,
    framewriteq,
    stream_server,
    arguments,
    on_predict_callback=None,
) -> bool:
    data = outputq.get(block=True)
    if data is None or global_variables.g_run_capture is False:
        print("stop output consumer")
        return False

    frame_num = data['frame_num']
    stream_url = data['url']
    image = data['image']
    image_with_mask = data['image_with_mask']
    count = data['count']

    if framewriteq:
        framewriteq.put_nowait({
            'stream_index': data["stream_index"],
            'frame_num': frame_num,
            'image': image,
            'frame': data["frame"],
            'count': count,
            'stream_name': data['stream_name']
        })

    show_heatmap = get_argument(
        data['stream_index'], 'show_heatmap', arguments)

    if on_predict_callback is not None:
        on_predict_callback(
            make_callback_payload(count, 'density_estimation'),
            stream_url,
            data['model_name'],
            data['stream_index'])

    if stream_server:
        output = np.array(
            image_with_mask if image_with_mask is not None
            else image)
        output = np.array(draw_on_output(
            output,
            "Cnt: {}".format(int(data['count'])),
        ))
        output = (
            output if not show_heatmap
            else concat_heatmap_to_output(output, data['density_map'])
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


def predict_density(
    image,
    network,
    transformFn,
    cuda,
    density_bias,
    area_points
):
    image_with_mask = None
    if area_points:
        image_with_mask, image, mask = polygon_mask(image, area_points)

    img = transformFn(Image.fromarray(image))

    if cuda:
        img = img.cuda()

    output = network(img.unsqueeze(0))
    output = output.detach().cpu()[0][0].numpy()
    height, width, _ = image.shape

    if density_bias:
        count = max(0, output.sum() - density_bias)
    else:
        count = output.sum()

    output = cv2.resize(np.float32(output), (width, height))

    if area_points:
        output = np.multiply(output, mask)

    return count, output, image_with_mask


def predict_consumer_thread_density(
    predictq,
    outputq,
    transformFn,
    arguments,
    get_model,
    get_area_points
):
    try:
        predictions = AverageMeter()
        while global_variables.g_run_capture:
            data = predictq.get(block=True)
            if data is None or global_variables.g_run_capture is False:
                print("stop predict consumer thread")
                outputq.put_nowait(None)
                break

            set_selected_gpu(
                get_argument(data['stream_index'], 'selected_gpu', arguments),
                get_argument(data['stream_index'], 'cuda', arguments))

            # initialize
            if data['frame_num'] == 0:
                count_sliding_window = SlidingWindow(
                    get_argument(
                        data['stream_index'],
                        'sliding_window',
                        arguments
                    )
                )

            model = get_model(data['stream_index'])
            area_points = get_area_points(data['stream_index'])
            count, dens_map, image_with_mask = predict_density(
                data['frame'],
                model,
                transformFn,
                get_argument(data['stream_index'], 'cuda', arguments),
                get_argument(data['stream_index'], 'bias', arguments),
                area_points)

            predictions.update(count)
            count_sliding_window.update(count)

            print("predict {} -> {} ({})".format(
                data['frame_num'], count, predictions.avg), data['url'])

            outputq.put_nowait({
                'image_with_mask': (
                    None if image_with_mask is None
                    else Image.fromarray(image_with_mask)
                ),
                'frame_num': data['frame_num'],
                'frame': data['frame'],
                'image': data['image'],
                'stream_name': data['stream_name'],
                'count': count_sliding_window.get(),
                'run_avg_count': predictions.avg,
                'density_map': dens_map,
                'url': data['url'],
                'model_name': data['model_name'],
                'stream_index': data['stream_index']
            })
    except Exception as e:
        print("Exiting because of error predict thread:", e)
        stop_stream()
        outputq.put_nowait(None)
