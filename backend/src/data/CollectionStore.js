const format = require('pg-format')

const getAllCollections = (db) => async (skip, limit, filter) => {
  try {
    // collection with frame count
    let query = `
      SELECT * FROM collections 
      LEFT JOIN (
        SELECT collection_id, COUNT(*) as frame_count
        FROM collection_frame
        GROUP BY collection_id
      ) frame_count
      ON collections.id = frame_count.collection_id
      LEFT JOIN (
        SELECT collection_id, COUNT(*) as frame_locked_count
        FROM collection_frame
        JOIN frames ON collection_frame.frame_id = frames.id
        WHERE frames.locked = true
        GROUP BY collection_id
      ) frame_locked_count
      ON collections.id = frame_locked_count.collection_id`

    if (filter) {
      query += ` WHERE collections.name ILIKE '%${filter}%'`
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

const getFramesForCollectionId = (db) => async (collectionId, skip, limit) => {
  try {
    const query = `
      SELECT * FROM frames
      LEFT JOIN frames_metadata ON frames_metadata.frames_id = frames.id
      WHERE frames.id IN (
        SELECT frame_id
        FROM collection_frame
        WHERE collection_id = $1
      )
      ORDER BY frames.id, frames_metadata.ts_utc
      LIMIT $2
      OFFSET $3`

    const res = await db.query(query, [collectionId, limit, skip])

    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getClosestTimestamp = (db) => async (id, timestamp, limit = 20) => {
  try {
    const query = `
      SELECT
        *,
        RANK() OVER (ORDER BY ts_utc) as rank
       FROM frames
      LEFT JOIN frames_metadata
      ON frames_metadata.frames_id = frames.id
      WHERE id IN (
        SELECT frame_id
        FROM collection_frame
        WHERE collection_id = $1
      )
      AND frames_metadata.ts_utc is not null
      ORDER BY abs(extract(epoch from (ts_utc - $2)))`

    const res = await db.query(query, [id, new Date(timestamp)])
    
    if (res.rows.length > 0) {
      const index = Number(res.rows[0].rank)

      return Math.floor(index / limit) + 1
    } else {
      return null
    }
  } catch (e) {
    console.error(e)
    return null
  }
}

const getFramesForCollectionIdWithTags = (db) => async (collectionId) => {
  try {
    const query = `
      SELECT frames.path as path, array_agg(x || ',' || y) as points FROM frames
      LEFT JOIN tags ON tags.frame_id = frames.id
      WHERE frames.id IN (
        SELECT frame_id
        FROM collection_frame
        WHERE collection_id = $1
      )
      GROUP BY frames.id`

    const res = await db.query(query, [collectionId])

    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getFramesForCollectionIdWithBboxes = (db) => async (collectionId) => {
  try {
    const query = `
      SELECT frames.path as path, array_agg(x || ',' || y || ',' || w || ',' || h || ',' || labels.name) as boxes FROM frames
      LEFT JOIN bounding_boxes ON bounding_boxes.frame_id = frames.id
      LEFT JOIN labels ON bounding_boxes.label_id = labels.id
      WHERE frames.id IN (
        SELECT frame_id
        FROM collection_frame
        WHERE collection_id = $1
      )
      GROUP BY frames.id`

    const res = await db.query(query, [collectionId])

    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}


const insertCollection = (db) => async (collectionName) => {
  try {
    const query = 'INSERT INTO collections (name) VALUES ($1) RETURNING *'
    const res = await db.query(query, [collectionName])
    const collection = res.rows[0]

    const selectQuery = `
    SELECT * FROM collections
    LEFT JOIN (
      SELECT collection_id, COUNT(*) as frame_count
      FROM collection_frame
      GROUP BY collection_id
    ) frame_count
    ON collections.id = frame_count.collection_id
    WHERE collections.id = $1`

    const selectRes = await db.query(selectQuery, [collection.id])

    return selectRes.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const addFramesToCollection = (db) => async (collectionId, frameIds) => {
  try {
    const values = frameIds.map(frameId => [collectionId, frameId])
    const query = format('INSERT INTO collection_frame (collection_id, frame_id) VALUES %L', values)
  
    await db.query(query)

    const selectQuery = `
      SELECT * FROM collections
      LEFT JOIN (
        SELECT collection_id, COUNT(*) as frame_count
        FROM collection_frame
        GROUP BY collection_id
      ) frame_count
      ON collections.id = frame_count.collection_id
      WHERE collections.id = $1`

    const res = await db.query(selectQuery, [collectionId])

    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalCollectionCount = (db) => async (filter) => {
  try {
    let query = "SELECT count(*) FROM collections"

    if (filter) {
      query += ` WHERE collections.name ILIKE '%${filter}%'`
    }

    const res = await db.query(query)

    return res.rows[0].count || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getCollectionById = (db) => async (id) => {
  try {
    const query = `
      SELECT * FROM collections
      LEFT JOIN (
        SELECT collection_id, COUNT(*) as frame_count
        FROM collection_frame
        GROUP BY collection_id
      ) frame_count
      ON collections.id = frame_count.collection_id
      LEFT JOIN (
        SELECT collection_id, COUNT(*) as frame_locked_count
        FROM collection_frame
        JOIN frames ON collection_frame.frame_id = frames.id
        WHERE frames.locked = true
        GROUP BY collection_id
      ) frame_locked_count
      ON collections.id = frame_locked_count.collection_id
      WHERE id = $1
    `

    const res = await db.query(query, [id])

    return res.rows[0]|| null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteCollectionById = (db) => async (id) => {
  try {
    const query = 'DELETE FROM collections WHERE id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getUnlockedFramesByCollectionId = (db) => async (id) => {
  try {
    const query = `
      SELECT * FROM frames
      WHERE frames.id IN (
        SELECT frame_id
        FROM collection_frame
        WHERE collection_id = $1
      )
      AND (locked = false OR locked is null)`

    const res = await db.query(query, [id])
    return res.rows
  } catch (e) {
    console.error(e)
    return null
  }
}

const getLockedFramesByCollectionId = (db) => async (id) => {
  try {
    const query = `
      SELECT * FROM frames
      WHERE frames.id IN (
        SELECT frame_id
        FROM collection_frame
        WHERE collection_id = $1
      )
      AND locked = true`

    const res = await db.query(query, [id])
    return res.rows
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteCollectionFramesById = (db) => async (id) => {
  try {
    const query = 'DELETE FROM collection_frame WHERE collection_id = $1'
    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

module.exports = ({ db }) => ({
  deleteCollectionFramesById: deleteCollectionFramesById(db),
  deleteCollectionById: deleteCollectionById(db),
  getClosestPage: getClosestTimestamp(db),
  getCollectionById: getCollectionById(db),
  getFramesForCollectionIdWithTags: getFramesForCollectionIdWithTags(db),
  insertCollection: insertCollection(db),
  getAllCollections: getAllCollections(db),
  getFramesForCollectionId: getFramesForCollectionId(db),
  addFramesToCollection: addFramesToCollection(db),
  getTotalCollectionCount: getTotalCollectionCount(db),
  getFramesForCollectionIdWithBboxes: getFramesForCollectionIdWithBboxes(db),
  getUnlockedFramesByCollectionId: getUnlockedFramesByCollectionId(db),
  getLockedFramesByCollectionId: getLockedFramesByCollectionId(db),
})
