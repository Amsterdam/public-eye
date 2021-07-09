import os
import json
import sys
import argparse
import eelib.store as store


"""
The ends of the folder are not joined with the starts.
This is because some of the folders seem to be missing.
"""


parser = argparse.ArgumentParser()
parser.add_argument('--folder', metavar='FOLDER', type=str,
                    help='Location of Fudan root folder', required=True)
parser.add_argument('--distance', type=int,
                    default=1, help='Distance between the frames')
parser.add_argument('--skip_between', type=bool,
                    default=False,
                    help='Skip between the distance of frames or not')

def integer_sort(value):
    return int(value)


def is_integer(value):
    try:
        int(value)
        return True
    except:
        return False


def handle_prefix(folder_location, folder_name, prefix):
    json_file_path = os.path.join(
        folder_location, 'train_data', folder_name, prefix + '.json')
    frame_file_path = os.path.join(
        folder_location, 'train_data', folder_name, prefix + '.jpg')

    print(f"Inserting frame: {frame_file_path}...")
    frame = store.insert_frame_if_not_exists(None, frame_file_path)
    if not frame:
        print('Frame already exists')
        return store.get_frame_by_path(frame_file_path)

    with open(json_file_path) as f:
        json_content = json.load(f)
        data = json_content[list(json_content)[0]] 
        for region in data['regions']:
            region = region['shape_attributes']
            store.insert_tag_if_not_exists(
                frame.id, region['x'], region['y'])

    return frame


# insert_frame_pair_loi_dataset_if_not_exists
# it is assumed that the frames in the folder follow eachother in order
def handle_grouped_folder(folder_location, dataset_id, folder_name, distance):
    files = os.listdir(os.path.join(
        folder_location, 'train_data', folder_name))
    prefixes = [
        file.split('.')[0]
        for file in files if is_integer(file.split('.')[0])]
    prefixes_sorted = sorted(list(set(prefixes)), key=integer_sort)

    for index, prefix1 in enumerate(prefixes_sorted):
        if distance and index % distance != 0:
            continue

        if index + distance >= len(prefixes_sorted):
            break

        prefix2 = prefixes_sorted[index + distance]
        frame1 = handle_prefix(folder_location, folder_name, prefix1)
        frame2 = handle_prefix(folder_location, folder_name, prefix2)
        store.insert_frame_pair_loi_dataset_if_not_exists(
            frame1.id, frame2.id, dataset_id)


def insert_dataset():
    args = parser.parse_args()
    datasetname = (
        f"Fudan-Distance-{args.distance}-SkipBetween-{args.skip_between}"
    )
    folder_location = args.folder
    train_folders = sorted(
        os.listdir(os.path.join(folder_location, 'train_data')),
        key=integer_sort)
    nn_type = store.get_nn_type_by_name("line_crossing_density")
    dataset_created = store.insert_dataset_if_not_exists(
        datasetname, nn_type.id)

    if not dataset_created:
        print('dataset with name {} exists already'.format(datasetname))
        sys.exit(1)

    dataset = store.get_dataset_by_name(datasetname)

    for folder in train_folders:
        handle_grouped_folder(
            folder_location, dataset.id, folder, args.distance)


store.connect()
insert_dataset()
