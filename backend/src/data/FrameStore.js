const insertFrame = (db) => async (path, videoFileId, timestamp) => {
  try {
    const query = `
      INSERT INTO frames (path, video_file_id, timestamp)
      VALUES ($1, $2, $3) RETURNING *`
    const res = await db.query(
      query, [path, videoFileId, Math.round(timestamp * 1000)])

    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getFrameById = (db) => async (id) => {
  try {
    const query = 'SELECT * FROM frames WHERE id = $1'

    const res = await db.query(query, [id])

    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteFrameById = (db) => async (id) => {
  try {
    const query = 'DELETE FROM frames WHERE id = $1'

    await db.query(query, [id])

    return true
  } catch (e) {
    console.error(e)
    return null
  }
}

const getFrameByVideoFileId = (db) => async (videoFileId, skip, limit) => {
  try {
    const query = `
      SELECT * FROM frames
      WHERE video_file_id = $1
      ORDER BY id
      LIMIT $2
      OFFSET $3`

    const res = await db.query(query, [videoFileId, limit, skip])
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const updateFrame = (db) => async (frameId, { locked, path }) => {
  try {
    const query = 'UPDATE frames SET locked = $1, path = $2 WHERE id = $3 RETURNING *'

    const res = await db.query(query, [locked, path, frameId])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteFrameFromCollections = (db) => async (frameId) => {
  try {
    const query = 'DELETE FROM collection_frame WHERE frame_id = $1'

    await db.query(query, [frameId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteFrameMetadata = (db) => async (frameId) => {
  try {
    const query = 'DELETE FROM frames_metadata WHERE frames_id = $1'

    await db.query(query, [frameId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const FrameStore = ({ db }) => ({
  deleteFrameMetadata: deleteFrameMetadata(db),
  deleteFrameFromCollections: deleteFrameFromCollections(db),
  deleteFrameById: deleteFrameById(db),
  updateFrame: updateFrame(db),
  insertFrame: insertFrame(db),
  getFrameByVideoFileId: getFrameByVideoFileId(db),
  getFrameById: getFrameById(db),
})

module.exports = FrameStore
