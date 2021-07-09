import eelib.postgres as pg


def insert_video_captured_by_camera(video_file_id, camera_id):
    query = """
        INSERT INTO video_captured_by_camera (camera_id, video_file_id)
        VALUES (%(cid)s, %(vid)s)
    """
    with pg.get_cursor() as cursor:
        return cursor.run(
            query,
            {
                'vid': video_file_id,
                'cid': camera_id
            }
        )


def get_frames_joined_with_video_for_collection_id(collection_id):
    query = """
        SELECT frames.*, video_files.path as video_file_path FROM frames
        JOIN collection_frame ON frames.id = collection_frame.frame_id
        JOIN video_files ON video_files.id = frames.video_file_id
        WHERE collection_frame.collection_id = %(cid)s
    """
    with pg.get_cursor() as cursor:
        return cursor.all(
            query,
            {
                'cid': collection_id
            }
        )


def insert_frame_pair_loi_dataset_if_not_exists(
    input_frame_id,
    target_frame_id,
    dataset_id
):
    with pg.get_cursor() as cursor:
        result = cursor.one(
            """
                SELECT * FROM frame_pair_loi_dataset
                WHERE input_frame_id=%(ifid)s
                AND target_frame_id=%(tfid)s
                AND dataset_id= %(did)s
            """,
            {
                'ifid': input_frame_id,
                'tfid': target_frame_id,
                'did': dataset_id
            }
        )
        if result is not None:
            return False

        query = """
            INSERT INTO frame_pair_loi_dataset
                (input_frame_id, target_frame_id, dataset_id)
            VALUES
                (%(ifid)s, %(tfid)s, %(did)s)
        """

        return cursor.run(
            query,
            {
                'ifid': input_frame_id,
                'tfid': target_frame_id,
                'did': dataset_id
            }
        )


def count_frames_in_collection_with_ts_utc_metadata(collection_id):
    query = """
        SELECT count(*) FROM frames
        JOIN collection_frame ON frames.id = collection_frame.frame_id
        JOIN frames_metadata ON frames_metadata.frames_id = frames.id
        WHERE collection_frame.collection_id = %(cid)s
        AND frames_metadata.ts_utc IS NOT NULL
    """
    with pg.get_cursor() as cursor:
        return cursor.one(
            query,
            {
                'cid': collection_id
            }
        )


def get_frame_pairs_for_loi_dataset_id(dataset_id):
    query = """
        SELECT
            input_frames.id as input_frame_id,
            target_frames.id as target_frame_id,
            input_frames.path as input_frame_path,
            target_frames.path as target_frame_path,
            array_remove(array_agg(tags.x), NULL) as tags_x,
            array_remove(array_agg(tags.y), NULL) as tags_y
        FROM frame_pair_loi_dataset
        JOIN frames input_frames
            ON input_frames.id = frame_pair_loi_dataset.input_frame_id
        JOIN frames target_frames
            ON target_frames.id = frame_pair_loi_dataset.target_frame_id
        LEFT JOIN tags ON input_frames.id = tags.frame_id
        GROUP BY
            frame_pair_loi_dataset.id,
            input_frame_path,
            target_frame_path,
            input_frames.id,
            target_frames.id
        HAVING frame_pair_loi_dataset.dataset_id = %(did)s
    """
    with pg.get_cursor() as cursor:
        return cursor.all(
            query,
            {
                'did': dataset_id
            }
        )


def get_frames_with_tags_ordered_for_loi_dataset_id(dataset_id):
    query = """
        SELECT
            frames.*,
            frame_loi_dataset.order_index as order_index,
            array_remove(array_agg(tags.x), NULL) as tags_x,
            array_remove(array_agg(tags.y), NULL) as tags_y
        FROM frames
        JOIN frame_loi_dataset ON frame_loi_dataset.frame_id = frames.id
        LEFT JOIN tags ON frames.id = tags.frame_id
        WHERE frame_loi_dataset.dataset_id = %(did)s
        GROUP BY
            frames.id,
            frame_loi_dataset.order_index,
            frame_loi_dataset.dataset_id
        ORDER BY order_index
    """
    with pg.get_cursor() as cursor:
        return cursor.all(
            query,
            {
                'did': dataset_id
            }
        )


def insert_frame_loi_dataset(order_index, frame_id, dataset_id):
    query = """
        INSERT INTO frame_loi_dataset (frame_id, dataset_id, order_index)
        VALUES (%(fid)s, %(did)s, %(oidx)s)
    """
    with pg.get_cursor() as cursor:
        cursor.run(
            query,
            {
                'fid': frame_id,
                'did': dataset_id,
                'oidx': order_index
            }
        )


def get_frames_for_collection_ordered(collection_id: int):
    query = """
        SELECT * FROM frames
        JOIN collection_frame ON frames.id = collection_frame.frame_id
        LEFT JOIN frames_metadata ON frames_metadata.frames_id = frames.id
        WHERE collection_frame.collection_id = %(cid)s
        ORDER BY
            frames_metadata.ts_utc,
            frames.id
    """
    with pg.get_cursor() as cursor:
        return cursor.all(
            query,
            {
                'cid': collection_id
            }
        )


def insert_camera_multicapture_link_if_not_exists(camera_id, multicapture_stream_id):
    with pg.get_cursor() as cursor:
        cursor.run(
            'INSERT INTO cameras_used_in_multicapture_stream (camera_id, multicapture_stream_id) VALUES (%(cid)s, %(mid)s) ON CONFLICT DO NOTHING',
            {
                'cid': camera_id,
                'mid': multicapture_stream_id
            }
        )

def get_calibration_by_camera_id(camera_id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM calibration WHERE camera_id = %(cid)s',
            {
                'cid': camera_id
            }
        )


def insert_camera_if_not_exists(stream_url):
    with pg.get_cursor() as cursor:
        result = cursor.one(
            'SELECT * FROM camera WHERE stream_url=%(stream)s',
            {
                'stream': stream_url
            }
        )
        if result is not None:
            return False

        cursor.one(
            'INSERT INTO camera (stream_url) VALUES (%(stream)s)',
            {
                'stream': stream_url
            }
        )
        return True


def get_camera_by_id(id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM camera WHERE id = %(id)s',
            {
                'id': id
            }
        )     

def get_camera_by_stream_url(stream_url):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM camera WHERE stream_url = %(stream)s',
            {
                'stream': stream_url
            }
        )

def get_groundtruths_by_frame_id(frame_id):
    with pg.get_cursor() as cursor:
        return cursor.all(
            "SELECT * FROM ground_truths WHERE frame_id = %(id)s",
            {
                "id": frame_id
            }
        )

def get_object_dataset_by_frame_id(frame_id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            "SELECT * FROM frame_object_recognition_dataset WHERE frame_id = %(id)s",
            {
                "id": frame_id
            }
        )

def delete_collection_by_id(id):
    with pg.get_cursor() as cursor:
        return cursor.run(
            "DELETE FROM collections WHERE id = %(id)s",
            {
                "id": id
            }
        )

def delete_collection_frames_by_id(id):
    with pg.get_cursor() as cursor:
        return cursor.run(
            "DELETE FROM collection_frame WHERE collection_id = %(id)s",
            {
                "id": id
            }
        )

def delete_frame_by_id(id):
    with pg.get_cursor() as cursor:
        return cursor.run(
            "DELETE FROM frames WHERE id = %(id)s",
            {
                "id": id
            }
        )

def delete_bboxes_by_frame_id(id):
    with pg.get_cursor() as cursor:
        return cursor.run(
            "DELETE FROM bounding_boxes WHERE frame_id = %(id)s",
            {
                "id": id
            }
        )

def delete_tags_by_frame_id(id):
    with pg.get_cursor() as cursor:
        return cursor.run(
            "DELETE FROM tags WHERE frame_id = %(id)s",
            {
                "id": id
            }
        )

def delete_frame_from_collections(id):
    with pg.get_cursor() as cursor:
        return cursor.run(
            "DELETE FROM collection_frame WHERE frame_id = %(id)s",
            {
                "id": id
            }
        )

def delete_frame_metadata(id):
    with pg.get_cursor() as cursor:
        return cursor.run(
            "DELETE FROM frames_metadata WHERE frames_id = %(id)s",
            {
                "id": id
            }
        )

def get_unlocked_frames_by_collection_id(id):
    with pg.get_cursor() as cursor:
        return cursor.all(
            """
            SELECT * FROM frames
            WHERE frames.id IN (
                SELECT frame_id
                FROM collection_frame
                WHERE collection_id = %(id)s
            )
            AND (locked = false OR locked is null)
            """,
            {
                "id": id
            }
        )

def get_locked_frames_by_collection_id(id):
    with pg.get_cursor() as cursor:
        return cursor.all(
            """
                SELECT * FROM frames
                WHERE frames.id IN (
                    SELECT frame_id
                    FROM collection_frame
                    WHERE collection_id = %(id)s
                )
                AND locked = true
            """
            ,{
                "id": id
            }
        )

def insert_nn_if_not_exists(train_script, nn_type_id):
    with pg.get_cursor() as cursor:
        result = cursor.one(
            'SELECT * FROM neural_networks WHERE train_script=%(ts)s',
            {
                'ts': train_script
            }
        )
        if result is not None:
            return False
        cursor.run(
            'INSERT INTO neural_networks (train_script, nn_type_id) VALUES (%(ts)s, %(nn)s)',
            {
                'ts': train_script,
                'nn': nn_type_id
            }
        )
        return True

def insert_frame_metadata(frame_id, frame_type, ts_utc, ts_vid):
    with pg.get_cursor() as cursor:
        cursor.run(
            'INSERT INTO frames_metadata (frames_id, ts_utc, ts_vid, type) VALUES (%(fid)s, %(tsutc)s, %(ts_vid)s, %(type)s)',
            {
                'fid': frame_id,
                'tsutc': ts_utc,
                'ts_vid': ts_vid,
                'type': frame_type
            }
        )

def delete_multi_capture(id):
    with pg.get_cursor() as cursor:
        cursor.run(
            'DELETE FROM multicaptures WHERE id = %(id)s',
            {
                'id': id
            }
        )


def insert_multicapture_stream_if_not_exists(name, job_id):
    with pg.get_cursor() as cursor:
        result = cursor.one(
            'SELECT * FROM multicapture_stream WHERE name=%(name)s AND running_job_id=%(jid)s',
            {
                'name': name, 'jid': job_id
            }
        )
        if result is not None:
            return False
        cursor.run(
            'INSERT INTO multicapture_stream (name, running_job_id) VALUES (%(n)s, %(jid)s)',
            {
                'n': name,
                'jid': job_id
            }
        )
        return True


def get_multi_capture_by_job_id_as_dict(job_id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT *, multicapture_stream.id as id FROM multicapture_stream JOIN jobs ON multicapture_stream.running_job_id = jobs.id WHERE running_job_id = %(id)s',
            {
                'id': job_id
            },
            back_as=dict
        )

def update_stream_instance_stream_path(id, output_stream_path):
    with pg.get_cursor() as cursor:
        cursor.run(
            'UPDATE stream_instance SET output_stream_path = %(osp)s WHERE id = %(id)s',
            {
                'osp': output_stream_path,
                'id': id
            }
        )

def get_stream_instance_by_job_id(id):
    with pg.get_cursor() as cursor:
        cursor.one(
            'SELECT * FROM stream_instance WHERE running_job_id = %(id)s',
            {
                'id': id
            }
        )

def get_train_run_by_model_id(model_id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM training_runs WHERE model_id = %(mid)s',
            {
                'mid': model_id
            }
        )

def insert_initial_train_run(date, job_id, training_set_id, validation_set_id, log_file_path):
    with pg.get_cursor() as cursor:
        cursor.run(
            'INSERT INTO training_runs (date, job_id, training_set_id, validation_set_id, log_file_path)  VALUES (%(d)s, %(jid)s, %(tid)s, %(vid)s, %(lfp)s) RETURNING id',
            {
                'd': date,
                'tid': training_set_id,
                'vid': validation_set_id,
                'lfp': log_file_path,
                'jid': job_id
            }
        )
        return cursor.fetchone()[0]

def update_train_run(id, model_id, config_id):
    with pg.get_cursor() as cursor:
        cursor.run(
            'UPDATE training_runs SET model_id = %(mid)s, config_id = %(cid)s WHERE id = %(id)s RETURNING *',
            {
                'id': id,
                'mid': model_id,
                'cid': config_id,
            }
        )
        return cursor.fetchone()[0]

def get_train_run_by_id_as_dict(id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            """
            SELECT training_runs.id as id, train_script, date, config_id, job_id, job_status, job_script_payload, models.name as model_name, models.path as model_path, neural_network_type.name as nn_type FROM training_runs
            LEFT JOIN models ON training_runs.model_id = models.id
            LEFT JOIN neural_networks ON training_runs.neural_network_id = neural_networks.id
            LEFT JOIN neural_network_type ON neural_network_type.id = neural_networks.nn_type_id
            JOIN jobs ON training_runs.job_id = jobs.id
            WHERE training_runs.id = %(id)s
            """,
            {
                'id': id
            },
            back_as=dict
        )

def insert_train_config(path):
    with pg.get_cursor() as cursor:
        cursor.run(
            'INSERT INTO train_configs (path) VALUES (%(p)s) RETURNING id',
            {
                'p': path
            }
        )
        return cursor.fetchone()[0]

def insert_score(score_name, score_value, training_run_id):
    with pg.get_cursor() as cursor:
        cursor.run(
            'INSERT INTO scores (score_name, score_value, training_run_id) VALUES (%(n)s, %(v)s, %(tid)s) RETURNING id',
            {
                'n': score_name,
                'v': score_value,
                'tid': training_run_id
            }
        )
        return cursor.fetchone()[0]

def insert_model(model_name, neural_network_id, path):
    with pg.get_cursor() as cursor:
        cursor.run(
            'INSERT INTO models (neural_network_id, path, name) VALUES (%(nnid)s, %(p)s, %(mn)s) RETURNING id',
            {
                'nnid': neural_network_id,
                'p': path,
                'mn': model_name
            }
        )
        return cursor.fetchone()[0]

def get_model_by_id(id):
    pg.connect()
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM models WHERE id = %(id)s',
            {
                'id': id
            }
        )

def get_model_by_name(name):
    pg.connect()
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM models WHERE name = %(name)s',
            {
                'name': name
            }
        )

def insert_gt(frame_id, dataset_id, gt_path, render_path):
    with pg.get_cursor() as cursor:
        cursor.run(
                'INSERT INTO ground_truths (frame_id, dataset_id, path, render_path) VALUES (%(fid)s, %(did)s, %(p)s, %(rp)s)',
                {
                    'fid': frame_id,
                    'did': dataset_id,
                    'p': gt_path,
                    'rp': render_path
                }
        )
        return True

def insert_dataset_if_not_exists(name, nn_type_id):
    with pg.get_cursor() as cursor:
        result = cursor.one(
            'SELECT id FROM datasets WHERE name=%(name)s AND nn_type_id=%(nt)s',
            {
                'name': name, 'nt': nn_type_id
            }
        )
        if result is not None:
            return False
        cursor.run(
                'INSERT INTO datasets (name, nn_type_id) VALUES (%(name)s, %(nt)s)',
                {
                    'name': name,
                    'nt': nn_type_id
                }
        )
        return True


def insert_tag_if_not_exists(frame_id, cx, cy):
    with pg.get_cursor() as cursor:
        result = cursor.one(
            """
                SELECT * FROM tags
                WHERE x=%(x)s AND y=%(y)s AND frame_id=%(frame_id)s
            """,
            {
                'x': cx,
                'y': cy,
                'frame_id': frame_id
            }
        )
        if result is not None:
            return False
        cursor.run(
            """
                INSERT INTO tags (frame_id, x, y)
                VALUES (%(frame_id)s, %(x)s, %(y)s)
            """,
            {
                'frame_id': frame_id,
                'x': cx,
                'y': cy
            }
        )
        return True

def insert_bounding_box_if_not_exists(frame_id, label_id, x, y, w, h):
    with pg.get_cursor() as cursor:
        result = cursor.one('SELECT * FROM bounding_boxes WHERE frame_id=%(fid)s AND x=%(x)s AND y=%(y)s AND w=%(w)s AND h=%(h)s',
            {
                'fid': frame_id,
                'x': x,
                'y': y,
                'w': w,
                'h': h
            }
        )
        if result is not None:
            return False
        cursor.run(
            'INSERT INTO bounding_boxes (frame_id, label_id, x, y, w, h) VALUES (%(fid)s, %(lid)s, %(x)s, %(y)s, %(w)s, %(h)s)',
            {
                'fid': frame_id,
                'lid': label_id,
                'x': x,
                'y': y,
                'w': w,
                'h': h
            }
        )
        return True

def get_stream_roi_by_id(id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM stream_roi WHERE id = %(id)s',
            {
                'id': id, 
            }
        )

def get_stream_loi_by_id(id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM stream_loi WHERE id = %(id)s',
            {
                'id': id, 
            }
        )

def insert_stream_instance(name, camera_id, model_id, neural_network_id, running_job_id):
    with pg.get_cursor() as cursor:
        cursor.run(
            'INSERT INTO stream_instance (name, camera_id, model_id, neural_network_id, running_job_id) VALUES (%(n)s, %(cid)s, %(mid)s, %(nid)s, %(rid)s) RETURNING id',
            {
                'n': name,
                'cid': camera_id,
                'mid': model_id,
                'nid': neural_network_id,
                'rid': running_job_id
            }
        )
        return cursor.fetchone()[0]


def insert_frame_object_recognition_dataset(frame_id, dataset_id):
    with pg.get_cursor() as cursor:
        cursor.run(
            'INSERT INTO frame_object_recognition_dataset (frame_id, dataset_id) VALUES (%(fid)s, %(did)s)',
            {
                'fid': frame_id,
                'did': dataset_id
            }
        )


def insert_collection_if_not_exists(collection_name):
    with pg.get_cursor() as cursor:
        result = cursor.one('SELECT * FROM collections WHERE name=%(name)s', { 'name': collection_name })
        if result is not None:
            return False
        cursor.run('INSERT INTO collections (name) VALUES (%(name)s)', { 'name': collection_name})
        return True

def insert_label_if_not_exists(label_name, rgb):
    with pg.get_cursor() as cursor:
        result = cursor.one('SELECT * FROM labels WHERE name=%(name)s', { 'name': label_name })
        if result is not None:
            return False
        cursor.run('INSERT INTO labels (name, rgb) VALUES (%(name)s, %(rgb)s)', { 'name': label_name, 'rgb': rgb})
        return True


def insert_frame_if_not_exists(
    video_id,
    frame_path,
    hidden=False
):
    with pg.get_cursor() as cursor:
        result = cursor.one(
            'SELECT * FROM frames WHERE path=%(path)s', {'path': frame_path})
        if result is not None:
            return False
        return cursor.one(
            """
                INSERT INTO frames
                    (path, video_file_id, timestamp, hidden_to_user)
                VALUES
                    (
                        %(path)s,
                        %(video_file_id)s,
                        %(timestamp)s,
                        %(hidden)s
                    )
                RETURNING *
            """,
            {
                'path': frame_path,
                'video_file_id': video_id,
                'timestamp': 0,
                'hidden': hidden
            }
        )


def insert_frame_if_not_exists_with_timestamp(
    video_id,
    frame_path,
    timestamp,
    hidden=None
):
    with pg.get_cursor() as cursor:
        result = cursor.one(
            'SELECT * FROM frames WHERE path=%(path)s', {'path': frame_path})
        if result is not None:
            return False
        return cursor.one(
            """
                INSERT INTO frames
                    (path, video_file_id, timestamp, hidden_to_user)
                VALUES
                    (%(path)s, %(video_file_id)s, %(timestamp)s, %(hidden)s)
                RETURNING *
            """,
            {
                'path': frame_path,
                'video_file_id': video_id,
                'timestamp': timestamp,
                'hidden': hidden
            }
        )


def insert_collection_frame_if_not_exists(col_id, frame_id):
    with pg.get_cursor() as cursor:
        result = cursor.one('SELECT * FROM collection_frame WHERE collection_id=%(col_id)s AND frame_id=%(frame_id)s', {
            'col_id': col_id,
            'frame_id': frame_id
        })
        if result is not None:
            return False

        cursor.run('INSERT INTO collection_frame (collection_id, frame_id) VALUES (%(col_id)s, %(frame_id)s)', {
            'col_id': col_id,
            'frame_id': frame_id
        })
        return True


def insert_video_file_if_not_exists(video_path):
    with pg.get_cursor() as cursor:
        result = cursor.one(
            'SELECT * FROM video_files WHERE path=%(path)s',
            {
                'path': video_path
            }
        )
        if result is not None:
            return result.id
        return cursor.one(
            'INSERT INTO video_files (path) VALUES (%(path)s) RETURNING id',
            {
                'path': video_path
            }
        )


def insert_selected_label_if_not_exists(model_id, label_id, index):
    with pg.get_cursor() as cursor:
        result = cursor.one(
            'SELECT * FROM selected_labels WHERE model_id=%(mid)s AND label_id=%(lid)s',
            {
                'mid': model_id,
                'lid': label_id
            }
        )
        if result is not None:
            return False
        cursor.run(
            'INSERT INTO selected_labels (model_id, label_id, index) VALUES (%(mid)s, %(lid)s, %(idx)s)',
            {
                'mid': model_id,
                'lid': label_id,
                'idx': index
            }
        )
        return True

def get_files_for_dataset(dataset):
    pg.connect()
    sql = 'SELECT frames.id AS frame_id, frames.path AS frame_path, ground_truths.id AS gt_id, ground_truths.path AS gt_path FROM ground_truths INNER JOIN frames ON ground_truths.frame_id = frames.id WHERE ground_truths.dataset_id = %(did)s'
    data = pg.all(sql, { 'did': dataset.id })
    conv = [{
                'frame': {
                    'id': r.frame_id,
                    'path': r.frame_path
                },
                'ground_truth': {
                    'id': r.gt_id,
                    'path': r.gt_path
                }
            } for r in data]
    return conv

def get_frames_for_object_recognition_dataset_by_id(dataset_id):
    with pg.get_cursor() as cursor:
        return cursor.all(
            'SELECT * FROM frames WHERE id IN (SELECT frame_id FROM frame_object_recognition_dataset WHERE dataset_id = %(did)s)',
            {
                'did': dataset_id
            }
        )

def get_bounding_boxes_for_object_recognition_dataset_by_id(dataset_id):
    with pg.get_cursor() as cursor:
        return cursor.all(
            'SELECT bounding_boxes.frame_id as frame_id, labels.name as label, bounding_boxes.x as x, bounding_boxes.y as y, bounding_boxes.w as w, bounding_boxes.h as h FROM bounding_boxes JOIN labels ON bounding_boxes.label_id = labels.id WHERE frame_id IN (SELECT frame_id FROM frame_object_recognition_dataset WHERE dataset_id = %(did)s)',
            {
                'did': dataset_id
            }
        )

def get_unique_labels_from_bounding_boxes_for_dataset(dataset_id):
    with pg.get_cursor() as cursor:
        return cursor.all(
            'SELECT DISTINCT labels.id FROM frame_object_recognition_dataset JOIN bounding_boxes ON frame_object_recognition_dataset.frame_id = bounding_boxes.frame_id JOIN labels ON labels.id = bounding_boxes.label_id WHERE dataset_id = %(did)s',
            {
                'did': dataset_id
            }
        )

def get_selected_label(model_id, label_id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM selected_labels WHERE model_id=%(mid)s AND label_id=%(lid)s',
            {
                'mid': model_id,
                'lid': label_id
            }
        )

def get_nn_type_by_name(name):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM neural_network_type WHERE name = %(name)s',
            {
                'name': name
            }
        )

def get_nn_type_by_id(id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM neural_network_type WHERE id = %(id)s',
            {
                'id': id
            }
        )

def get_groundtruths_for_dataset(dataset_id):
    with pg.get_cursor() as cursor:
        return cursor.all(
            'SELECT * FROM ground_truths WHERE dataset_id = %(did)s',
            {
                'did': dataset_id
            }
        )

def get_training_run_by_job_id(job_id):
    with pg.get_cursor() as cursor:
        return cursor.one('SELECT * FROM training_runs WHERE job_id = %(job_id)s', { 'job_id': job_id })

def get_neural_network_by_script(script_name):
    with pg.get_cursor() as cursor:
        return cursor.one('SELECT * FROM neural_networks WHERE train_script = %(script_name)s', { 'script_name': script_name })

def get_neural_network_by_id(id):
    with pg.get_cursor() as cursor:
        return cursor.one('SELECT * FROM neural_networks WHERE id = %(id)s', { 'id': id })

def get_dataset_by_id_as_dict(id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM datasets WHERE id=%(id)s',
            { 'id': id },
            back_as=dict
        )

def get_dataset_by_id(id):
    pg.connect()
    return pg.one('SELECT * FROM datasets WHERE id=%(id)s', { 'id': id })

def get_dataset_by_name(name):
    pg.connect()
    return pg.one('SELECT * FROM datasets WHERE name=%(name)s', { 'name': name })

def get_collection_by_name(name):
    pg.connect()
    return pg.one('SELECT * FROM collections WHERE name=%(name)s', { 'name': name })

def get_collection_by_id(id):
    with pg.get_cursor() as cursor:
        return cursor.one('SELECT * FROM collections WHERE id=%(id)s', { 'id': id })

def get_frames_for_collection(collection):
    sql = 'SELECT * FROM frames WHERE id IN (SELECT frame_id FROM collection_frame WHERE collection_id = %(col_id)s)'
    return pg.all(sql, { 'col_id': collection.id })

def get_frame_with_video_by_id(id):
    query = """
        SELECT frames.*, video_files.path as video_file_path FROM frames
        LEFT JOIN video_files ON frames.video_file_id = video_files.id
        WHERE frames.id=%(id)s
    """
    with pg.get_cursor() as cursor:
        return cursor.one(query, { 'id': id })

def get_frame_by_id(id):
    pg.connect()
    return pg.one('SELECT * FROM frames WHERE id=%(id)s', { 'id': id })

def get_frame_by_path(path):
    with pg.get_cursor() as cursor:
        return cursor.one('SELECT * FROM frames WHERE path=%(path)s', { 'path': path })

def get_label_by_name(label_name):
    with pg.get_cursor() as cursor:
        return cursor.one('SELECT * FROM labels WHERE name=%(name)s', { 'name': label_name })

def get_labels_for_object_recognition_dataset(dataset_id):
    with pg.get_cursor() as cursor:
        return cursor.all(
            'SELECT * FROM labels WHERE id IN (SELECT bounding_boxes.label_id FROM bounding_boxes JOIN frames ON frames.id = bounding_boxes.frame_id JOIN frame_object_recognition_dataset ON frames.id = frame_object_recognition_dataset.frame_id  WHERE frame_object_recognition_dataset.dataset_id = %(did)s)',
            {
                'did': dataset_id
            }
        )

def save_stream_name(stream_instance_id, stream_name):
    with pg.get_cursor() as cursor:
        return cursor.run(
            'UPDATE stream_instance SET output_stream_path = %(sn)s WHERE id = %(id)s',
            {
                'sn': stream_name,
                'id': stream_instance_id
            }
        )

def get_stream_instance_by_id_as_dict(id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT *, stream_instance.id as id FROM stream_instance JOIN jobs ON stream_instance.running_job_id = jobs.id WHERE stream_instance.id = %(id)s',
            {
                'id': id
            },
            back_as=dict
        )

def get_stream_instance_by_name(name):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM stream_instance WHERE name = %(name)s',
            {
                'name': name
            }
        )

def get_stream_capture_by_url(url):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM stream_capture WHERE stream_url = %(url)s',
            {
                'url': url
            }
        )

def get_stream_capture_by_id(id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM stream_capture WHERE id = %(id)s',
            {
                'id': id
            }
        )

def get_calibration_by_stream_capture_id(id):
    with pg.get_cursor() as cursor:
        return cursor.one(
            'SELECT * FROM calibration WHERE stream_capture_id = %(id)s',
            {
                'id': id
            }
        )

def get_selected_labels_by_model_id(model_id):
    with pg.get_cursor() as cursor:
        return cursor.all(
            'SELECT * from selected_labels JOIN labels ON selected_labels.label_id = labels.id WHERE model_id = %(mid)s',
            {
                'mid': model_id
            }
        )

def get_tags_for_frame(frame):
    pg.connect()
    return pg.all('SELECT * FROM tags WHERE frame_id=%(id)s', { 'id': frame.id })

def connect():
    pg.connect()
