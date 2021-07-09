const R =  require('ramda')

const getAllDatasets = (db) => async (skip, limit, filter, nnType) => {
  try {
    let query = `
      SELECT
        datasets.id as id,
        datasets.name as name,
        neural_network_type.name as nn_type,
        (
          count(ground_truths.id)
          + count(frame_pair_loi_dataset.id)
          + count(frame_object_recognition_dataset.dataset_id)
        ) as frame_count
      FROM datasets
      JOIN neural_network_type ON datasets.nn_type_id = neural_network_type.id
      LEFT JOIN ground_truths ON ground_truths.dataset_id = datasets.id
      LEFT JOIN frame_pair_loi_dataset ON frame_pair_loi_dataset.dataset_id = datasets.id
      LEFT JOIN frame_object_recognition_dataset ON frame_object_recognition_dataset.dataset_id = datasets.id
      GROUP BY
        datasets.id,
        neural_network_type.name
    `

    if (filter) {
      query += ` HAVING datasets.name LIKE '%${filter}%'`
      if (nnType) {
        query += ` AND neural_network_type.name = '${nnType}'`
      }
    } else if (nnType) {
      query += ` HAVING neural_network_type.name = '${nnType}'`
    }

    query += ` ORDER BY id`

    if (limit) {
      query += ` LIMIT ${limit}`
    }

    if (skip) {
      query += ` OFFSET ${skip}`
    }

    const res = await db.query(query)
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalDatasetsCount = (db) => async (filter, nnType) => {
  try {
    let query = `
      SELECT count(*) FROM datasets
      JOIN neural_network_type ON datasets.nn_type_id = neural_network_type.id
    `

    if (filter) {
      query += ` WHERE datasets.name LIKE '%${filter}%'`
      if (nnType) {
        query += ` AND neural_network_type.name = '${nnType}'`
      }
    } else if (nnType) {
      query += ` WHERE neural_network_type.name = '${nnType}'`
    }

    const res = await db.query(query)

    return res.rows[0].count || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getLoiFramePairsForDataset = (db) => async (datasetId) => {
  try {
    const query = `
      SELECT
        frame_pair_loi_dataset.id,
        input_frames.id as input_frame_id,
        target_frames.id as target_frame_id
      FROM frame_pair_loi_dataset
      JOIN frames input_frames ON input_frames.id = frame_pair_loi_dataset.input_frame_id
      JOIN frames target_frames ON target_frames.id = frame_pair_loi_dataset.target_frame_id
      WHERE frame_pair_loi_dataset.dataset_id = $1
      GROUP BY
        frame_pair_loi_dataset.id,
        input_frames.id,
        target_frames.id
    `
    const res = await db.query(query, [datasetId])
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getFramesAndGroundTruthsForDataset = (db) => async (datasetId) => {
  try {
    const query = `
      SELECT frames.path AS frame_path, frames.id AS frame_id, ground_truths.id AS gt_id
      FROM ground_truths, frames
      WHERE ground_truths.frame_id = frames.id
      AND ground_truths.dataset_id = $1`

    const res = await db.query(query, [datasetId])
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getFramesAndBoundingBoxesForDataset = (db) => async (datasetId) => {
  try {
    const query = `
      SELECT 
        frames.id AS frame_id,
        frames.path AS frame_path,
        array_agg(bounding_boxes.id) as bounding_box_id,
        array_agg(bounding_boxes.x) as bounding_box_x,
        array_agg(bounding_boxes.y) as bounding_box_y,
        array_agg(bounding_boxes.w) as bounding_box_w,
        array_agg(bounding_boxes.h) as bounding_box_h,
        array_agg(labels.name) as bounding_box_label,
        array_agg(labels.rgb) as bounding_box_rgb
      FROM frames
      LEFT JOIN bounding_boxes ON bounding_boxes.frame_id = frames.id
      FULL OUTER JOIN labels ON labels.id = bounding_boxes.label_id
      WHERE frames.id in (
        SELECT frame_id FROM frame_object_recognition_dataset WHERE dataset_id = $1
      )
      GROUP BY frames.id`

    const res = await db.query(query, [datasetId])
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getDatasetById = (db) => async (datasetId) => {
  try {
    const query = `
      SELECT
        datasets.*,
        neural_network_type.name as nn_type,
        (
          count(ground_truths.id)
          + count(frame_pair_loi_dataset.id)
          + count(frame_object_recognition_dataset.dataset_id)
        ) as frame_count
      FROM datasets
      JOIN neural_network_type ON datasets.nn_type_id = neural_network_type.id
      LEFT JOIN ground_truths ON ground_truths.dataset_id = datasets.id
      LEFT JOIN frame_pair_loi_dataset ON frame_pair_loi_dataset.dataset_id = datasets.id
      LEFT JOIN frame_object_recognition_dataset ON frame_object_recognition_dataset.dataset_id = datasets.id
      GROUP BY
        datasets.id,
        neural_network_type.name
      HAVING
        datasets.id = $1`

    const res = await db.query(query, [datasetId])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getDatasetIdsForFrameId = (db) => async (frameId) => {
  try {
    const queryObjectDataset = 'SELECT DISTINCT dataset_id FROM frame_object_recognition_dataset WHERE frame_id = $1'
    const resObjectDataset = await db.query(queryObjectDataset, [frameId])
    const queryDensityDataset = 'SELECT DISTINCT dataset_id FROM ground_truths WHERE frame_id = $1'
    const resDensityObjectDataset = await db.query( queryDensityDataset, [frameId])

    return R.uniq(R.concat(resObjectDataset.rows, resDensityObjectDataset.rows))
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteDatasetById = (db) => async (id) => {
  try {
    const query = 'DELETE FROM datasets WHERE id = $1'

    db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getTrainingRunByDatasetId = (db) => async (id) => {
  try {
    const query = `
      SELECT * FROM training_runs
      WHERE (
        training_set_id = $1
        OR validation_set_id = $1
      )
    `

    const res = await db.query(query, [id])

    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return false
  }
}

const DatasetStore = ({ db }) => ({
  getTrainingRunByDatasetId: getTrainingRunByDatasetId(db),
  deleteDatasetById: deleteDatasetById(db),
  getDatasetById: getDatasetById(db),
  getDatasetIdsForFrameId: getDatasetIdsForFrameId(db),
  getFramesAndBoundingBoxesForDataset: getFramesAndBoundingBoxesForDataset(db),
  getAllDatasets: getAllDatasets(db),
  getFramesAndGroundTruthsForDataset: getFramesAndGroundTruthsForDataset(db),
  getLoiFramePairsForDataset: getLoiFramePairsForDataset(db),
  getTotalDatasetsCount: getTotalDatasetsCount(db),
})
  
module.exports = DatasetStore
