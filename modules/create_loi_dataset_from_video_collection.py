import sys
import eelib.job as job
import eelib.store as store
from modules.create_loi_dataset_utils import extract_frame


def handle_video_collection(collection_id, dataset_id, ss_delta_next_frame):
    frames = store.get_frames_joined_with_video_for_collection_id(
        collection_id)

    if len(frames) == 0:
        print(f"No frames in collection '{collection_id}' connected to video")
        sys.exit(1)

    for frame in frames:
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
            frame.id, next_frame.id, dataset_id)


def get_distance(job_args):
    try:
        distance = int(job_args['distance'])
        assert distance > 0
        return distance
    except:
        print('Using distance of 1...')
        return 1


def get_skip_between(job_args):
    try:
        return job_args['skip_between']
    except:
        return False


def main() -> None:
    job_args = job.get_job_args()
    if not job_args:
        print('no job arguments found')
        sys.exit(1)

    if 'collection_id' not in job_args:
        print('collection id not found in arguments')
        sys.exit(1)

    collection = store.get_collection_by_id(job_args['collection_id'])

    if collection is None:
        print(f"Collection with id: {job_args['collection_id']} \
            does not exists")

    if 'dataset_name' not in job_args:
        print('dataset_name not found in arguments')
        sys.exit(1)

    if 'ss_delta_next_frame' not in job_args and job_args['ss_delta_next_frame']:
        print("'ss_delta_next_frame' is required for frames from video")
        sys.exit(1)
    try:
        ss_delta_next_frame = float(job_args['ss_delta_next_frame'])
    except:
        print(f"ss_delta_next_frame '{ss_delta_next_frame}' can't be cast\
            to float")
        sys.exit(1)

    nn_type = store.get_nn_type_by_name("line_crossing_density")
    dataset_created = store.insert_dataset_if_not_exists(
        job_args["dataset_name"], nn_type.id)

    if not dataset_created:
        print('dataset with name {} exists already'.format(
            job_args["dataset_name"]))
        sys.exit(1)

    dataset = store.get_dataset_by_name(job_args["dataset_name"])

    handle_video_collection(
        job_args['collection_id'], dataset.id, ss_delta_next_frame)
    print('done')


main()
