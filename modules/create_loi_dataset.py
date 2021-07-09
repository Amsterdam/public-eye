import sys
import eelib.job as job
import eelib.store as store
from modules.create_loi_dataset_utils import extract_frame


# example
# {
#   "scriptName" : "create__loi_dataset.py",
#   "scriptArgs": {
#     "dataset_name": "my test set",
#     "frames": [5,10,11,12, ...],
#   }
# }
def main():
    job_args = job.get_job_args()

    if not job_args:
        print('no job arguments found')
        sys.exit(1)

    if 'frames' not in job_args:
        print('missing frames argument')
        sys.exit(1)

    if 'dataset_name' not in job_args:
        print('missing dataset_name argument')
        sys.exit(1)

    frame_ids = job_args['frames']
    dataset_name = job_args['dataset_name']

    nn_type = store.get_nn_type_by_name("line_crossing_density")
    dataset_created = store.insert_dataset_if_not_exists(
        dataset_name, nn_type.id)

    if not dataset_created:
        print('dataset with name {} exists already'.format(dataset_name))
        sys.exit(1)

    dataset = store.get_dataset_by_name(dataset_name)

    print('dataset {}'.format(dataset))

    if 'ss_delta_next_frame' not in job_args:
        print("'ss_delta_next_frame' is required for frames from video")
        sys.exit(1)

    try:
        ss_delta_next_frame = float(job_args['ss_delta_next_frame'])
    except:
        print(f"ss_delta_next_frame '{ss_delta_next_frame}' can't be cast\
            to float")
        sys.exit(1)

    for frame_id in frame_ids:
        frame = store.get_frame_with_video_by_id(frame_id)
        if not frame.video_file_path:
            print('Each frame should be connected to video')
            sys.exit(1)

        frame_path = extract_frame(
            frame.video_file_path,
            (frame.timestamp / 1000) + ss_delta_next_frame)

        if not frame_path:
            continue

        # insert frame not to far in the future from current frame
        # that is hidden from the user in the UI
        next_frame = store.insert_frame_if_not_exists_with_timestamp(
            frame.video_file_id,
            frame_path,
            frame.timestamp + int(ss_delta_next_frame * 1000),
            hidden=True
        )
        store.insert_frame_pair_loi_dataset_if_not_exists(
            frame.id, next_frame.id, dataset.id)

    print('done')


main()
