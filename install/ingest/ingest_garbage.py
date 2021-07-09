import os
import eelib.postgres as pg
from  install.ingest.utils import ingest_object_recognition

def main():
    pg.connect()

    root = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'public_datasets', 'GarbageDataset')
    def line_replace_function(line, path):
        return line.replace('./data', path).replace('\n', '')

    ingest_object_recognition(
        path=root,
        collection_name='garbage_train',
        dataset_file_path=os.path.join(root, 'cfg', 'garb_train.txt'),
        names_path=os.path.join(root, 'cfg', 'garb.names'),
        line_replace_function=line_replace_function
    )
    ingest_object_recognition(
        path=root,
        collection_name='garbage_test',
        dataset_file_path=os.path.join(root, 'cfg', 'garb_test.txt'),
        names_path=os.path.join(root, 'cfg', 'garb.names'),
        line_replace_function=line_replace_function
    )
    ingest_object_recognition(
        path=root,
        collection_name='garbage_trainval',
        dataset_file_path=os.path.join(root, 'cfg', 'garb_trainval.txt'),
        names_path=os.path.join(root, 'cfg', 'garb.names'),
        line_replace_function=line_replace_function
    )

main()
