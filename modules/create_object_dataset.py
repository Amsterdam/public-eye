import sys
import eelib.job as job
import eelib.store as store


# example
# {
#   "scriptName" : "create_dataset.py",
#   "scriptArgs": {
#     "dataset_name": "my test set",
#     "frames": [5,10,11,12, ...],
#     "density_config": {
#       "sigma": 12,
#       "beta": -1,
#     }
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

    frames = job_args['frames']
    dataset_name = job_args['dataset_name']

    nn_type = store.get_nn_type_by_name("object_recognition")

    dataset_created = store.insert_dataset_if_not_exists(
        dataset_name, nn_type.id)
    if not dataset_created:
        print('dataset with name {} exists already'.format(dataset_name))
        sys.exit(1)

    dataset = store.get_dataset_by_name(dataset_name)

    print('dataset {}'.format(dataset))

    print(frames, dataset.id)
    for frame_id in frames:
        store.insert_frame_object_recognition_dataset(frame_id, dataset.id)

    print('done')


main()
