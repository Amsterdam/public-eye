import eelib.store as store
import sys
import numpy as np
import copy
import cv2
import gc
import matplotlib
from eelib.stream.stream_utils import (
    rescale_output,
    make_callback_payload,
    output_consumer_loop,
    get_argument,
    set_selected_gpu,
    stop_stream
)
import eelib.stream.global_variables as global_variables
from scipy.spatial.distance import euclidean
from eelib.ml.polygon_mask import polygon_mask
from eelib.ml_object_recognition.detect_image import detect_image_2

MIN_DIST_METERS = 1.5


@output_consumer_loop
def output_consumer_thread_object(
    outputq,
    framewriteq,
    stream_server,
    arguments,
    on_predict_callback=None,
) -> bool:
    data = outputq.get(block=True)
    if data is None or global_variables.g_run_capture is False:
        return False
        print("stop output consumer")

    image_with_bounding_boxes = data['bounding_box_image']
    count = data['count']
    stream_url = data['url']
    violation_count = data['violation_count']

    if on_predict_callback is not None:
        on_predict_callback(
            make_callback_payload(
                count, 'object_recognition', violation_count),
            stream_url,
            data['model_name'],
            data['stream_index'])

    if stream_server:
        output_scale_factor = get_argument(
            data['stream_index'], 'output_scale_factor', arguments)
        output = (
            image_with_bounding_boxes if not output_scale_factor
            else rescale_output(
                image_with_bounding_boxes, output_scale_factor)
        )
        stream_server.push_image(output)

    if framewriteq:
        framewriteq.put_nowait({
            'stream_index': data["stream_index"],
            'frame_num': data["frame_num"],
            'frame': data["frame"],
            'count': count,
            'stream_name': data['stream_name']
        })

    print('written ({} items left)'.format(outputq.qsize()))
    return True


def get_classes_and_colors(model_id):
    labels = sorted(
        store.get_selected_labels_by_model_id(model_id), 
        key=lambda x: x.index)
    classes = [label.name for label in labels]
    colours = [label.rgb for label in labels]

    return classes, colours


def apply_proj(points, M):

    points2 = []
    Mat = M
    for p in points.T:
        x = p[0]
        y = p[1]

        M_11 = Mat[0][0]
        M_12 = Mat[0][1]
        M_13 = Mat[0][2]

        M_21 = Mat[1][0]
        M_22 = Mat[1][1]
        M_23 = Mat[1][2]

        M_31 = Mat[2][0]
        M_32 = Mat[2][1]
        M_33 = Mat[2][2]

        px = (M_11 * x + M_12 * y + M_13) / (M_31 * x + M_32 * y + M_33)
        py = (M_21 * x + M_22 * y + M_23) / (M_31 * x + M_32 * y + M_33)

        points2.append([px, py])

    return np.array(points2)


def get_to_close_indices(transformed_points, scaling_factor):
    box_indices_standing_to_close = set()
    for idx, transformed_point_1 in enumerate(transformed_points):
        for jfx, transformed_point_2 in enumerate(transformed_points):
            dist = euclidean(transformed_point_1, transformed_point_2)

            if (dist / scaling_factor) < MIN_DIST_METERS and idx != jfx:
                box_indices_standing_to_close.add(idx)
                box_indices_standing_to_close.add(jfx)

    return list(box_indices_standing_to_close)


# draw a bbox
def draw_bbox(img, bbox, colors, classes, to_close=False):
    label = classes[int(bbox[-1])]
    if int(bbox[-1]) != 0:
        return img

    confidence = int(float(bbox[6])*100)
    label = label+' '+str(confidence)+'%'

    p1 = tuple([int(b) for b in bbox[1:3]])
    p2 = tuple([int(b) for b in bbox[3:5]])

    color = colors[int(bbox[-1])]
    color = tuple(int(c * 100) for c in matplotlib.colors.to_rgb(color))
    if to_close:
        color = (0, 0, 255)

    # cv2.rectangle(np.ones(img.shape, np.uint8), p1, p2, color)
    cv2.rectangle(img, p1, p2, color, 4)

    text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 1, 1)[0]
    p3 = (p1[0], p1[1] - text_size[1] - 4)
    p4 = (p1[0] + text_size[0] + 4, p1[1])

    cv2.rectangle(img, p3, p4, color, -1)

    cv2.putText(
        img, label, p1, cv2.FONT_HERSHEY_SIMPLEX, 1, [225, 255, 255], 1)
    return img


def handle_bboxes(img, boxes, colours, labels, to_close=[]):
    result = copy.deepcopy(img)
    for idx, bbox in enumerate(boxes):
        result = draw_bbox(
            result, bbox, colours, labels, to_close=idx in to_close)

    return result


def predict_object(
    image,
    network,
    classes,
    colours,
    social_distance,
    projection,
    scaling_factor,
    cuda,
    area_points,
    object_threshold,
    non_max_suppresion
):
    image_with_mask = None
    if area_points:
        image_with_mask, image, _ = polygon_mask(image, area_points)

    bboxes = detect_image_2(
        network, cuda, [image], obj_thresh=object_threshold or 0.95,
        nms_thresh=non_max_suppresion or 0.5)

    if len(bboxes) == 0:
        return (
            image_with_mask if image_with_mask is not None
            else image, 0, 0 if social_distance else None
        )

    # only select persons [class: 0]
    bboxes = np.array(
        [bbox.detach().numpy() for bbox in bboxes[0] if int(bbox[-1]) == 0])

    if len(bboxes) == 0:
        return (
            image_with_mask if image_with_mask is not None
            else image, 0, 0 if social_distance else None)

    indices_standing_to_close = []

    if social_distance:
        # get bottom center of bounding boxes
        x_coordinate = ((bboxes[:, 3] - bboxes[:, 1]) / 2) + bboxes[:, 1]
        y_coordinate = bboxes[:, 4]
        points = np.array([
            x_coordinate,
            y_coordinate,
            np.ones(x_coordinate.shape[0])])

        # hardcoded to transform using oxford callibration
        transformed_points = apply_proj(points, projection)
        indices_standing_to_close = get_to_close_indices(
            transformed_points, scaling_factor)

    result_image = handle_bboxes(
        image_with_mask if image_with_mask is not None else image,
        bboxes,
        colours,
        classes,
        to_close=indices_standing_to_close)

    return (
        result_image,
        len(bboxes),
        len(indices_standing_to_close) if social_distance else None
    )


def predict_consumer_thread_object(
    predictq,
    outputq,
    arguments,
    get_model,
    get_area_points
):
    try:
        while global_variables.g_run_capture:
            data = predictq.get(block=True)
            if data is None or global_variables.g_run_capture is False:
                print("stop predict consumer thread")
                outputq.put_nowait(None)
                break

            set_selected_gpu(
                get_argument(data['stream_index'], 'selected_gpu', arguments),
                get_argument(data['stream_index'], 'cuda', arguments))

            if data['frame_num'] == 0:
                model_id = get_argument(
                    data['stream_index'], 'model', arguments)
                classes, colours = get_classes_and_colors(model_id)

            # network or get_model should be set
            network = get_model(data['stream_index'])
            area_points = get_area_points(data['stream_index'])
            network.eval()

            projection, calibration_scale = None, None
            if get_argument(
                data['stream_index'], 'social_distance', arguments
            ):
                stream = get_argument(
                    data['stream_index'], 'stream', arguments)
                camera = store.get_camera_by_stream_url(stream)
                calibration = store.get_calibration_by_camera_id(camera.id)
                if calibration is None:
                    print('Cannot use social distance if stream is\
                        not calibrated yet')
                    outputq.put_nowait(None)
                    stop_stream()
                    sys.exit(1)

                calibration_scale = calibration.scaling_factor
                projection = np.array([
                    [calibration.matrix_a, calibration.matrix_c, 0],
                    [calibration.matrix_b, calibration.matrix_d, 0],
                    [0, 0, 1]
                ])

            image_with_bounding_boxes, count, violation_count = predict_object(
                data['frame'],
                network,
                classes,
                colours,
                get_argument(
                    data['stream_index'], 'social_distance', arguments),
                projection,
                calibration_scale,
                get_argument(data['stream_index'], 'cuda', arguments),
                area_points,
                get_argument(
                    data['stream_index'], 'object_threshold', arguments),
                get_argument(
                    data['stream_index'], 'non_max_suppression', arguments))

            outputq.put_nowait({
                'frame_num': data['frame_num'],
                'frame': data['frame'],
                'image': data['image'],
                'stream_index': data['stream_index'],
                'url': data['url'],
                'count': count,
                'violation_count': violation_count,
                'model_name': data['model_name'],
                'stream_name': data['stream_name'],
                'bounding_box_image': image_with_bounding_boxes
            })
    except Exception as e:
        print("Exiting because of error in predict thread: ", e)
        stop_stream()
        outputq.put_nowait(None)
    finally:
        del network
        gc.collect()
