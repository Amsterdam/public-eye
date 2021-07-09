import os
import eelib.postgres as pg
from  install.ingest.utils import ingest_object_recognition

def main():
    pg.connect()
    root = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files', 'public_datasets', 'coco')

    def line_replace_function(line, root):
        return line.replace('../coco', root).replace('\n', '')

    ingest_object_recognition(
        path=root,
        collection_name='coco_2017_train',
        dataset_file_path=os.path.join(root, 'train2017.txt'),
        names_path=os.path.join(os.environ['EAGLE_EYE_PATH'], 'eelib', 'ml_object_recognition', 'dataset_names', 'coco.names'),
        line_replace_function=line_replace_function
    )
    ingest_object_recognition(
        path=root,
        collection_name='coco_2017_val',
        dataset_file_path=os.path.join(root, 'val2017.txt'),
        names_path=os.path.join(os.environ['EAGLE_EYE_PATH'], 'eelib', 'ml_object_recognition', 'dataset_names', 'coco.names'),
        line_replace_function=line_replace_function
    )

main()
