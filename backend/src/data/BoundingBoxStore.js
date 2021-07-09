const insertBoundingBox = (db) => async ({ frameId, labelId, x, y, w, h }) => {
  try {
    const insert_query = "INSERT INTO bounding_boxes (frame_id, label_id, x, y, w, h) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *"
    const insert_res = await db.query(insert_query, [frameId, labelId, x, y, w, h])
    const id = insert_res.rows[0].id
    const select_query = "SELECT bounding_boxes.id as bb_id, * FROM bounding_boxes JOIN labels ON bounding_boxes.label_id=labels.id WHERE bounding_boxes.id = $1"
    const res = await db.query(select_query, [id])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getBoundingBoxesByFrameId = (db) => async (frameId) => {
  try {
    const query = "SELECT bounding_boxes.id as bb_id, * FROM bounding_boxes JOIN labels ON bounding_boxes.label_id=labels.id WHERE bounding_boxes.frame_id = $1"
    const res = await db.query(query, [frameId])
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteBoundingBox = (db) => async (boundingBoxId) => {
  try {
    const query = "DELETE FROM bounding_boxes WHERE id = $1"
    await db.query(query, [boundingBoxId])
  } catch (e) {
    console.error(e)
    return null
  }
}

const updateBoundingBoxLabel = (db) => async (boundingBoxId, labelId) => {
  try {
    const insert_query = "UPDATE bounding_boxes SET label_id = $1 WHERE id = $2 RETURNING *"
    const insert_res = await db.query(insert_query, [labelId, boundingBoxId])
    const id = insert_res.rows[0].id
    const select_query = "SELECT bounding_boxes.id as bb_id, * FROM bounding_boxes JOIN labels ON bounding_boxes.label_id=labels.id WHERE bounding_boxes.id = $1"
    const res = await db.query(select_query, [id])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteBoundingBoxesByFrameId = (db) => async (frameId) => {
  try {
    const query = "DELETE FROM bounding_boxes WHERE frame_id = $1"

    await db.query(query, [frameId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const BoundingBoxStore = ({ db }) => ({
  deleteBoundingBoxesByFrameId: deleteBoundingBoxesByFrameId(db),
  updateBoundingBoxLabel: updateBoundingBoxLabel(db),
  deleteBoundingBox: deleteBoundingBox(db),
  insertBoundingBox: insertBoundingBox(db),
  getBoundingBoxesByFrameId: getBoundingBoxesByFrameId(db),
})

module.exports = BoundingBoxStore