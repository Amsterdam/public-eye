import sys
import eelib.job as job
import eelib.store as store


def main():
    job_args = job.get_job_args()
    if not job_args:
        print('no job arguments found')
        sys.exit(1)

    if 'collection_id' not in job_args:
        print('collection id not found in arguments')
        sys.exit(1)

    if 'dataset_name' not in job_args:
        print('missing dataset_name argument')
        sys.exit(1)

    collection = store.get_collection_by_id(job_args['collection_id'])
    frames = store.get_frames_for_collection(collection)
    if frames is None or len(frames) == 0:
        print("Can't created dataset without frames")
        sys.exit(1)

    dataset_name = job_args["dataset_name"]

    nn_type = store.get_nn_type_by_name("object_recognition")
    dataset_created = store.insert_dataset_if_not_exists(
        dataset_name, nn_type.id)

    if not dataset_created:
        print('dataset with name {} exists already'.format(dataset_name))
        sys.exit(1)

    dataset = store.get_dataset_by_name(dataset_name)

    for frame in frames:
        store.insert_frame_object_recognition_dataset(frame.id, dataset.id)

    print('done')


main()
