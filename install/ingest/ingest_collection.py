import os
import glob
import eelib.postgres as pg
import scipy.io as io
import csv

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
    x = tag[0]
    y = tag[1]

    sql = 'SELECT * FROM tags WHERE x=%(x)s AND y=%(y)s AND frame_id=%(frame_id)s'
    tag = pg.one(sql, { 'x': x, 'y': y, 'frame_id': frame_id })
    if tag is None:
        sql = 'INSERT INTO tags (x, y, frame_id) VALUES (%(x)s, %(y)s, %(frame_id)s)'
        pg.run(sql, { 'x': x, 'y': y, 'frame_id': frame_id })

def ingest(path, collection_name):
    col = create_collection(collection_name)

    img_paths = [img_path for img_path in glob.glob(os.path.join(path, '*.jpg'))]
    for img_path in img_paths:
        csv_path = img_path.replace('.jpg', '-tags.csv')
        print("ingest {}, {}, into {}".format(img_path, csv_path, col.name))
        frame_id = insert_frame_for_collection(col, img_path)
        lc = 0
        with open(csv_path) as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=",")
            for row in csv_reader:
                # skip x,ys
                if lc == 0:
                    lc += 1
                    continue
                lc += 1
                x = int(row[0])
                y = int(row[1])
                insert_tag(frame_id, [x, y])

def main():
    pg.connect()
    root = os.path.join(os.environ['EAGLE_EYE_PATH'], 'files/local_datasets/')

   # ingest(os.path.join(root, "MT_PicNic"), 'MT_PicNic')
    ingest(os.path.join(root, "MT_PicNic_CrossVal"), 'MT_PicNic_CrossVal')

    ingest(os.path.join(root, "MT_Boardwalk"), 'MT_Boardwalk')
    ingest(os.path.join(root, "MT_Boardwalk_CrossVal"), 'MT_Boardwalk_CrossVal')

    ingest(os.path.join(root, "MT_Waterfront"), 'MT_Waterfront')
    ingest(os.path.join(root, "MT_Waterfront_CrossVal"), 'MT_Waterfront_CrossVal')

main()
