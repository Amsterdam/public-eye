import os
import glob
import eelib.store as store
import random

def handle_image(collection, img_path, classes):
    label_path = img_path.replace('/images', '/labels').replace('.jpg', '.txt')

    store.insert_frame_if_not_exists(None, img_path)
    frame = store.get_frame_by_path(img_path)
    store.insert_collection_frame_if_not_exists(collection.id, frame.id)
    try:
        with open(label_path) as f:
            for line in f.readlines():
                splitted = line.split()
                try:
                    label_name = classes[int(splitted[0])]
                except KeyError:
                    print("Skipping label in {} : Class was not present in .names file".format(img_path))
                    continue

                label = store.get_label_by_name(label_name)

                try:
                    x = float(splitted[1])
                    y = float(splitted[2])
                    w = float(splitted[3])
                    h = float(splitted[4])
                except:
                    print("Skipping label in {} : Something wrong with label format".format(img_path))
                    continue

                store.insert_bounding_box_if_not_exists(frame.id, label.id, x, y, w, h)
    except:
        print("Skipping label in {} : Label file not found".format(img_path))

def get_object_recognition_classes(names_path):
    with open(names_path) as f:
        return [label.replace("\n", "") for label in f.readlines()]

def ingest_object_recognition_dataset(
    path,
    dataset_file_path,
    dataset,
    line_replace_function,
    collection,
    class_map
):
    with open(dataset_file_path) as f:
        for line in f.readlines():
            frame_path = line_replace_function(line, path)

            print("Added frame {} to dataset {}".format(frame_path, dataset.name))
            handle_image(collection, frame_path, class_map)
            frame = store.get_frame_by_path(frame_path)
            try:
                store.insert_frame_object_recognition_dataset(frame.id, dataset.id)
            except:
                print("Skipping adding {} to dataset {}".format(frame_path, dataset.name))

    return dataset

def random_hex():
    color = "%06x" % random.randint(0, 0xFFFFFF)
    return '#{}'.format(color)

def ingest_object_recognition(path, collection_name, dataset_file_path, names_path, line_replace_function):
    classes = get_object_recognition_classes(names_path)

    print("classes in dataset: {}".format(classes))
    class_map = {label_name: idx for idx, label_name in enumerate(classes)}
    nn_type = store.get_nn_type_by_name("object_recognition")
    store.insert_dataset_if_not_exists(collection_name, nn_type.id)
    dataset = store.get_dataset_by_name(collection_name)

    for label_name in classes:
        hex_color = random_hex()
        store.insert_label_if_not_exists(label_name, hex_color)
        label = store.get_label_by_name(label_name)
    
    store.insert_collection_if_not_exists(collection_name)
    collection = store.get_collection_by_name(collection_name)
    dataset = ingest_object_recognition_dataset(
        path, dataset_file_path, dataset, line_replace_function, collection, classes)
