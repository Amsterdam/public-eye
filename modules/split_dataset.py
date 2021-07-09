import sys
import eelib.job as job
import eelib.store as store
from eelib.websocket import send_websocket_message


def handle_density(job_args):
    nn_type = store.get_nn_type_by_name("density_estimation")
    store.insert_dataset_if_not_exists(job_args["dataset_name_1"], nn_type.id)
    dataset_1 = store.get_dataset_by_name(job_args["dataset_name_1"])
    store.insert_dataset_if_not_exists(job_args["dataset_name_2"], nn_type.id)
    dataset_2 = store.get_dataset_by_name(job_args["dataset_name_2"])

    groundtruths = store.get_groundtruths_for_dataset(job_args["dataset_id"])

    if len(groundtruths) == 0:
        print('no ground truths in the dataset')
        sys.exit(1)

    split_index = int(len(groundtruths) * job_args["split"])
    groundtruths_dataset_1 = groundtruths[:split_index]
    for groundtruth in groundtruths_dataset_1:
        store.insert_gt(
            groundtruth.frame_id,
            dataset_1.id,
            groundtruth.path,
            groundtruth.render_path
        )

    groundtruths_dataset_2 = groundtruths[split_index:]
    for groundtruth in groundtruths_dataset_2:
        store.insert_gt(
            groundtruth.frame_id,
            dataset_2.id,
            groundtruth.path,
            groundtruth.render_path
        )

    return dataset_1, dataset_2


def handle_object(job_args):
    nn_type = store.get_nn_type_by_name("object_recognition")
    store.insert_dataset_if_not_exists(job_args["dataset_name_1"], nn_type.id)
    dataset_1 = store.get_dataset_by_name(job_args["dataset_name_1"])
    store.insert_dataset_if_not_exists(job_args["dataset_name_2"], nn_type.id)
    dataset_2 = store.get_dataset_by_name(job_args["dataset_name_2"])

    frames = store.get_frames_for_object_recognition_dataset_by_id(
        job_args["dataset_id"])

    if len(frames) == 0:
        print('no frames in the dataset')
        sys.exit(1)

    split_index = int(len(frames) * job_args["split"])
    frames_dataset_1 = frames[:split_index]
    for frame in frames_dataset_1:
        store.insert_frame_object_recognition_dataset(frame.id, dataset_1.id)

    frames_dataset_2 = frames[split_index:]
    for frame in frames_dataset_2:
        store.insert_frame_object_recognition_dataset(frame.id, dataset_2.id)

    return dataset_1, dataset_2


def handle_loi(job_args):
    nn_type = store.get_nn_type_by_name("line_crossing_density")
    store.insert_dataset_if_not_exists(job_args["dataset_name_1"], nn_type.id)
    dataset_1 = store.get_dataset_by_name(job_args["dataset_name_1"])
    store.insert_dataset_if_not_exists(job_args["dataset_name_2"], nn_type.id)
    dataset_2 = store.get_dataset_by_name(job_args["dataset_name_2"])

    frame_pairs = store.get_frame_pairs_for_loi_dataset_id(
        job_args["dataset_id"])

    if len(frame_pairs) == 0:
        print('no frame pairs in the dataset')
        sys.exit(1)

    split_index = int(len(frame_pairs) * job_args["split"])

    frame_pairs_dataset_1 = frame_pairs[:split_index]
    for frame_pair in frame_pairs_dataset_1:
        store.insert_frame_pair_loi_dataset_if_not_exists(
            frame_pair.input_frame_id,
            frame_pair.target_frame_id,
            dataset_1.id
        )

    frame_pairs_dataset_2 = frame_pairs[split_index:]
    for frame_pair in frame_pairs_dataset_2:
        store.insert_frame_pair_loi_dataset_if_not_exists(
            frame_pair.input_frame_id,
            frame_pair.target_frame_id,
            dataset_2.id
        )

    return dataset_1, dataset_2


# example
# {
#   "scriptName" : "split_density_dataset.py",
#   "scriptArgs": {
#      "dataset_id": 1,
#      "split": 0.7,
#      "dataset_1_name": "train",
#      "dataset_2_name": "test"
#    }
# }
def main():
    job_args = job.get_job_args()
    if not job_args:
        print('no job arguments found')
        sys.exit(1)

    if 'dataset_id' not in job_args:
        print('dataset_id argument is required')
        sys.exit(1)

    if 'split' not in job_args:
        print('split argument is required')
        sys.exit(1)

    if 'dataset_name_1' not in job_args:
        print('dataset_name_1 argument is required')
        sys.exit(1)

    if 'dataset_name_2' not in job_args:
        print('dataset_name_2 argument is required')
        sys.exit(1)

    if not (job_args['split'] < 1 and job_args['split'] > 0):
        print('split should be value between zero and 1')
        sys.exit(1)

    dataset = store.get_dataset_by_id(job_args["dataset_id"])
    nn_type = store.get_nn_type_by_id(dataset.nn_type_id)
    if nn_type.name == "object_recognition":
        dataset_1, dataset_2 = handle_object(job_args)
        send_websocket_message(
            'dataset',
            'new',
            store.get_dataset_by_id_as_dict(dataset_1.id)
        )
        send_websocket_message(
            'dataset',
            'new',
            store.get_dataset_by_id_as_dict(dataset_2.id)
        )

    if nn_type.name == "density_estimation":
        dataset_1, dataset_2 = handle_density(job_args)
        send_websocket_message(
            'dataset',
            'new',
            store.get_dataset_by_id_as_dict(dataset_1.id)
        )
        send_websocket_message(
            'dataset',
            'new',
            store.get_dataset_by_id_as_dict(dataset_2.id)
        )

    if nn_type.name == "line_crossing_density":
        dataset_1, dataset_2 = handle_loi(job_args)
        send_websocket_message(
            'dataset',
            'new',
            store.get_dataset_by_id_as_dict(dataset_1.id)
        )
        send_websocket_message(
            'dataset',
            'new',
            store.get_dataset_by_id_as_dict(dataset_2.id)
        )

    print('done', nn_type)


main()
