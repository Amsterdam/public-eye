import sys
import eelib.job as job
import eelib.store as store


def handle_stream_collection(
    frames,
    dataset_id,
    skip_between,
    distance=1
):
    for index, input_frame, in enumerate(frames):
        if skip_between and index % distance != 0:
            continue

        if index + distance >= len(frames):
            break

        target_frame = frames[index + distance]
        store.insert_frame_pair_loi_dataset_if_not_exists(
            input_frame.id, target_frame.id, dataset_id)


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

    frames = store.get_frames_for_collection(collection)
    if frames is None or len(frames) == 0:
        print("Can't created dataset without frames")
        sys.exit(1)

    if 'dataset_name' not in job_args:
        print('dataset_name not found in arguments')
        sys.exit(1)

    nn_type = store.get_nn_type_by_name("line_crossing_density")
    dataset_created = store.insert_dataset_if_not_exists(
        job_args["dataset_name"], nn_type.id)

    if not dataset_created:
        print('dataset with name {} exists already'.format(
            job_args["dataset_name"]))
        sys.exit(1)

    dataset = store.get_dataset_by_name(job_args["dataset_name"])
    distance = get_distance(job_args)
    skip_between = get_skip_between(job_args)
    handle_stream_collection(
        frames,
        dataset.id,
        skip_between,
        distance
    )

    print('done')


main()
