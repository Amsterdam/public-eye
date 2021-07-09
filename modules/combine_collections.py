import sys
import eelib.job as job
import eelib.store as store


def main():
    collection_ids = job.get_or_fail('collection_ids')
    new_collection_name = job.get_or_fail('collection_name')
    inserted = store.insert_collection_if_not_exists(new_collection_name)

    if not inserted:
        print('Collection: ', new_collection_name, 'already exists')
        sys.exit(1)

    new_collection = store.get_collection_by_name(new_collection_name)

    for collection_id in collection_ids:
        col = store.get_collection_by_id(collection_id)
        frames = store.get_frames_for_collection(col)
        for frame in frames:
            store.insert_collection_frame_if_not_exists(new_collection.id, frame.id)

    print('done')

main()
