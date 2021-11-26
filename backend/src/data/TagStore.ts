import format from 'pg-format'
import { Database } from 'db'
import { FrameTag } from 'typescript-types'

const insertTags = (db: Database) => async ({
  tags,
  frameId,
}: {
  tags: {
    x: number,
    y: number,
  }[],
  frameId: number,
}) => {
  try {
    const values = tags.map(({ x, y }) => [frameId, Math.round(x), Math.round(y)])
    const query = format('INSERT INTO tags (frame_id, x, y) VALUES %L', values)

    await db.query(query)
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const insertTag = (db: Database) => async (
  frameId: number,
  { x, y }: { x: number, y: number },
): Promise<FrameTag | null> => {
  try {
    const query = 'INSERT INTO tags (frame_id, x, y) VALUES ($1, $2, $3) RETURNING *'

    const res = await db.query<FrameTag>(query, [frameId, x, y])

    return res ? res.rows[0] : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteTag = (db: Database) => async (
  tagId: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM tags where id = $1'

    await db.query(query, [tagId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const retrieveTagsForFrameId = (db: Database) => async (
  frameId: number,
) => {
  try {
    const query = 'SELECT * FROM tags WHERE frame_id = $1'

    const res = await db.query<FrameTag>(query, [frameId])

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const updateTag = (db: Database) => async (
  tagId: number,
  x: number,
  y: number,
): Promise<FrameTag | null> => {
  try {
    const query = 'UPDATE tags SET x = $1, y = $2 WHERE id = $3 RETURNING *'

    const res = await db.query<FrameTag>(query, [x, y, tagId])

    return res ? res.rows[0] : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteTagsByFrameId = (db: Database) => async (
  frameId: number,
) => {
  try {
    const query = 'DELETE FROM tags WHERE frame_id = $1'

    await db.query(query, [frameId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export type TagStoreType = {
  deleteTagsByFrameId: ReturnType<typeof deleteTagsByFrameId>,
  insertTags: ReturnType<typeof insertTags>,
  insertTag: ReturnType<typeof insertTag>,
  retrieveTagsForFrameId: ReturnType<typeof retrieveTagsForFrameId>,
  deleteTag: ReturnType<typeof deleteTag>,
  updateTag: ReturnType<typeof updateTag>,
}

const TagStore = ({ db }: { db: Database }): TagStoreType => ({
  deleteTagsByFrameId: deleteTagsByFrameId(db),
  insertTags: insertTags(db),
  insertTag: insertTag(db),
  retrieveTagsForFrameId: retrieveTagsForFrameId(db),
  deleteTag: deleteTag(db),
  updateTag: updateTag(db),
})

export default TagStore
