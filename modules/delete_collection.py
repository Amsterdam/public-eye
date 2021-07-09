import sys
import eelib.store as store
import eelib.job as job
import os
from eelib.websocket import send_websocket_message

def main():
    collection_id = job.get_or_fail('collection_id')
    collection = store.get_collection_by_id(collection_id)
    if collection is None:
        print(f"collection with id: {collection_id} doesn't exist")
        sys.exit(1)

    frames = store.get_unlocked_frames_by_collection_id(collection_id)
    database_referenced = False
    print(f"Starting to delete {len(frames)} frames")
    for frame in frames:
        try:
            ground_truths = store.get_groundtruths_by_frame_id(frame.id)
            if len(ground_truths) > 0:
                print(f"Frame: {frame.id} is still referenced by density dataset therefore it is not deleted")
                database_referenced = True
                continue

            object_dataset = store.get_object_dataset_by_frame_id(frame.id)
            if object_dataset is not None:
                print(f"Frame: {frame.id} is still referenced by object dataset therefore it is not deleted")
                database_referenced = True
                continue

            print(f"Deleting db references to [metadata, collections, tags, bounding boxes] frame: {frame.id}")
            store.delete_frame_metadata(frame.id)
            store.delete_frame_from_collections(frame.id)
            store.delete_tags_by_frame_id(frame.id)
            store.delete_bboxes_by_frame_id(frame.id)

            print(f"Delete frame db reference: {frame.id} and remove {frame.path}")
            os.unlink(frame.path)
            store.delete_frame_by_id(frame.id)
        except Exception as e:
            print(e)

    locked_frames = store.get_locked_frames_by_collection_id(collection_id)
    if database_referenced:
        print('Some frames where still references by dataset and therefor not deleted.')
    elif len(locked_frames) == 0:
        print("No locked frames therefore deleting collection.")
        store.delete_collection_frames_by_id(collection_id)
        store.delete_collection_by_id(collection_id)
        send_websocket_message('info', 'new', f"Collection '{collection.name}' succesfully deleted")
    else:
        send_websocket_message('info', 'new',
            f"All unlocked frames from collection '{collection.name}' succesfully deleted")

    print("finished")

main()
