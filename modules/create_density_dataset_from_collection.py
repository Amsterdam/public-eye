import sys
import eelib.job as job
import eelib.store as store
from eelib.store_utils import handle_create_gt_from_frame


def main():
    job_args = job.get_job_args()
    if not job_args:
        print('no job arguments found')
        sys.exit(1)

    if 'collection_id' not in job_args:
        print('collection id not found in arguments')
        sys.exit(1)

    if 'density_config' not in job_args:
        print('missing density_config argument')
        sys.exit(1)

    density_config = job_args['density_config']
    if 'sigma' not in density_config:
        sigma = -1
    else:
        sigma = density_config['sigma']

    if 'beta' not in density_config:
        beta = -1
    else:
        beta = density_config['beta']

    collection = store.get_collection_by_id(job_args['collection_id'])
    frames = store.get_frames_for_collection(collection)
    if frames is None or len(frames) == 0:
        print("Can't created dataset without frames")
        sys.exit(1)

    if 'dataset_name' not in job_args:
        dataset_name = "{}-sigma-{}-beta-{}".format(
            collection.name, sigma, beta)
    else:
        dataset_name = job_args["dataset_name"]

    nn_type = store.get_nn_type_by_name("density_estimation")
    dataset_created = store.insert_dataset_if_not_exists(
        dataset_name, nn_type.id)

    if not dataset_created:
        print('dataset with name {} exists already'.format(dataset_name))
        sys.exit(1)

    dataset = store.get_dataset_by_name(dataset_name)

    for frame in frames:
        handle_create_gt_from_frame(frame.id, dataset, sigma, beta)


main()
