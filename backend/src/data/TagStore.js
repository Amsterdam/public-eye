const format = require('pg-format')

const insertTags = (db) => async ({ tags, frameId }) => {
  try {
    const values = tags.map(( { x, y }) => [frameId, Math.round(x), Math.round(y)])
    const query = format('INSERT INTO tags (frame_id, x, y) VALUES %L', values)

    await db.query(query)
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertTag = (db) => async (frameId, { x, y}) => {
  try {
    const query = 'INSERT INTO tags (frame_id, x, y) VALUES ($1, $2, $3) RETURNING *'

    const res = await db.query(query, [frameId, x, y])

    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteTag = (db) => async (tagId) => {
  try {
    const query = 'DELETE FROM tags where id = $1'

    await db.query(query, [tagId])
  } catch (e) {
    console.error(e)
    return null
  }
}

const retrieveTagsForFrameId = (db) => async (frameId) => {
  try {
    const query = 'SELECT * FROM tags WHERE frame_id = $1'

    const res = await db.query(query, [frameId])

    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const updateTag = (db) => async (tagId, x, y) => {
  try {
    const query = 'UPDATE tags SET x = $1, y = $2 WHERE id = $3 RETURNING *'

    const res = await db.query(query, [x, y, tagId])

    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteTagsByFrameId = (db) => async (frameId) => {
  try {
    const query = 'DELETE FROM tags WHERE frame_id = $1'

    await db.query(query, [frameId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const TagStore = ({db}) => ({
  deleteTagsByFrameId: deleteTagsByFrameId(db),
  insertTags: insertTags(db),
  insertTag: insertTag(db),
  retrieveTagsForFrameId: retrieveTagsForFrameId(db),
  deleteTag: deleteTag(db),
  updateTag: updateTag(db),
})
  
module.exports = TagStore
