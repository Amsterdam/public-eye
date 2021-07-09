import os
import glob
import eelib.postgres as pg
import scipy.io as io

def create_collection(collection_name):
    sql = 'SELECT * FROM collections WHERE name=%(name)s'
    col = pg.one(sql, { 'name': collection_name })
    if col is None:
        sql = 'INSERT INTO collections (name) VALUES (%(name)s)'
        pg.run(sql, { 'name': collection_name })
        sql = 'SELECT * FROM collections WHERE name=%(name)s'
        col = pg.one(sql, { 'name': collection_name })
    return col

def insert_frame_for_collection(col, img_path):
    sql = 'SELECT * FROM frames WHERE path=%(path)s'
    frame = pg.one(sql, { 'path': img_path })
    if frame is None:
        sql = 'INSERT INTO frames (path, timestamp) VALUES (%(img_path)s, 0) RETURNING id'
        with pg.get_cursor() as cursor:
            frame_id = cursor.one(sql, { 'img_path' : img_path })
    else:
        frame_id = frame.id

    sql = 'SELECT * FROM collection_frame WHERE collection_id=%(cid)s AND frame_id=%(fid)s'
    rel = pg.one(sql, { 'cid': col.id, 'fid': frame_id })
    if rel is None:
        sql = 'INSERT INTO collection_frame (collection_id, frame_id) VALUES (%(col_id)s, %(frame_id)s)'
        pg.run(sql, { 'col_id': col.id, 'frame_id': frame_id })

    return frame_id

def insert_tag(frame_id, tag):
    x = int(tag[0])
    y = int(tag[1])

    sql = 'SELECT * FROM tags WHERE x=%(x)s AND y=%(y)s AND frame_id=%(frame_id)s'
    tag = pg.one(sql, { 'x': x, 'y': y, 'frame_id': frame_id })
    if tag is None:
        sql = 'INSERT INTO tags (x, y, frame_id) VALUES (%(x)s, %(y)s, %(frame_id)s)'
        pg.run(sql, { 'x': x, 'y': y, 'frame_id': frame_id })

def load_mat(img_path):
    mat = io.loadmat(img_path.replace('.jpg','.mat').replace('images','ground_truth').replace('IMG_','GT_IMG_'))
    return mat['annotation']

def ingest(path, collection_name):
    col = create_collection(collection_name)

    img_paths = [img_path for img_path in glob.glob(os.path.join(path, '*.jpg'))]
    for img_path in img_paths:
        print("ingest {} into {}".format(img_path, col.name))
        frame_id = insert_frame_for_collection(col, img_path)
        mat = load_mat(img_path)
        for pt in mat:
            insert_tag(frame_id, pt)

def main():
    pg.connect()
    root = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files/public_datasets/venice')
    part_A_train = os.path.join(root,'train_data','images')
    part_A_test = os.path.join(root,'test_data','images')

    print("ingest {}".format(part_A_train))
    ingest(part_A_train, 'venice-train')
    print("ingest {}".format(part_A_test))
    ingest(part_A_test, 'venice-test')

main()
