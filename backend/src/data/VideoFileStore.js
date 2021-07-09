const getVideoFileById = (db) => async (id) => {
  try {
    const query = `
      SELECT * FROM video_files
      LEFT JOIN (
        SELECT video_file_id, COUNT(*) as frame_count
        FROM frames
        GROUP BY video_file_id
      ) frame_count
      ON video_files.id = frame_count.video_file_id
      LEFT JOIN (
        SELECT video_file_id, COUNT(*) as frame_locked_count
        FROM frames
        WHERE frames.locked = true
        GROUP BY video_file_id
      ) frame_locked_count
      ON video_files.id = frame_locked_count.video_file_id
      WHERE id = $1
    `

    const res = await db.query(query, [id])

    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getAllVideos = (db) => async (skip, limit, filter) => {
  try {
    // video file with frame count
    let query = `
      SELECT * FROM video_files
      LEFT JOIN (
        SELECT video_file_id, COUNT(*) as frame_count
        FROM frames
        GROUP BY video_file_id
      ) frame_count
      ON video_files.id = frame_count.video_file_id
      LEFT JOIN (
        SELECT video_file_id, COUNT(*) as frame_locked_count
        FROM frames
        WHERE frames.locked = true
        GROUP BY video_file_id
      ) frame_locked_count
      ON video_files.id = frame_locked_count.video_file_id`

    if (filter) {
      query += ` WHERE video_files.path ILIKE '%${filter}%'`
    }

    query += ' ORDER BY video_files.id'

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

const insertVideoFile = (db) => async (path) => {
  const query = "INSERT INTO video_files (path) VALUES ($1) RETURNING id"
  const res = await db.query(query, [path])
  return res.rows[0].id || null
}

const deleteVideoFileById = (db) => async (id) => {
  try {
    const query = "DELETE FROM video_files WHERE id = $1"

    db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const updateVideoFile = (db) => async (id, path) => {
  try {
    const insertQuery = 'UPDATE video_files SET path = $1 WHERE id = $2'
    await db.query(insertQuery, [path, id])

    const selectQuery = `
      SELECT * FROM video_files
      LEFT JOIN (
        SELECT video_file_id, COUNT(*) as frame_count
        FROM frames GROUP BY video_file_id
      ) frame_count
      ON video_files.id = frame_count.video_file_id
      WHERE video_files.id = $1`

    const res = await db.query(selectQuery, [id])
    
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalVideoCount = (db) => async (filter) => {
  try{
    let query = 'SELECT count(*) FROM video_files'

    if (filter) {
      query += ` WHERE video_files.path ILIKE '%${filter}%'`
    }

    const res = await db.query(query)

    return res.rows[0].count || null
  } catch (e) {
    console.error(e)
    return null
  }
}

module.exports = (deps) => ({
  updateVideoFile: updateVideoFile(deps.db),
  deleteVideoFileById: deleteVideoFileById(deps.db),
  insertVideoFile: insertVideoFile(deps.db),
  getVideoFileById: getVideoFileById(deps.db),
  getAllVideos: getAllVideos(deps.db),
  getTotalVideoCount: getTotalVideoCount(deps.db),
})
