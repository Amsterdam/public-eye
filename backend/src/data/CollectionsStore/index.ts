import format from 'pg-format'
import { Database } from 'db'
import { path } from 'ramda'
import {
  Collection,
  Frame,
} from 'typescript-types'

const getAllCollections = (db: Database) => async (
  skip?: number,
  limit?: number,
  filter?: string,
): Promise<Collection[] | null> => {
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

    query += ' ORDER BY id'

    if (limit) {
      query += ` LIMIT ${limit}`
    }

    if (skip) {
      query += ` OFFSET ${skip}`
    }

    const res = await db.query(query)

    return res ? res.rows as Collection[] : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getFramesForCollectionId = (db: Database) => async (
  collectionId?: number,
  skip?: number,
  limit?: number,
): Promise<Frame[] | null> => {
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

    return res ? res.rows as Frame[] : null
  } catch (e) {
    console.error(e)
    return null
  }
}

type Timestamp = {
  rank: number,
}

const getClosestTimestamp = (db: Database) => async (
  id: number,
  timestamp: number,
  limit = 20,
): Promise<number | null> => {
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

    const res = await db.query(
      query,
      [
        id,
        new Date(timestamp),
      ],
    )

    if (res && res.rows.length > 0) {
      const index = Number((res.rows[0] as Timestamp).rank)

      return Math.floor(index / limit) + 1
    }
    return null
  } catch (e) {
    console.error(e)
    return null
  }
}

type FrameWithTag = {
  path: string,
  points: [number, number][]
}

const getFramesForCollectionIdWithTags = (db: Database) => async (
  collectionId: number,
): Promise<FrameWithTag[] | null> => {
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

    const res = await db.query<FrameWithTag>(query, [collectionId])

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

type FrameWithBoundingBox = {
  path: string,
  boxes: [number, number, number, number, string][],
}

const getFramesForCollectionIdWithBboxes = (db: Database) => async (
  collectionId: number,
): Promise<FrameWithBoundingBox[] | null> => {
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

    const res = await db.query<FrameWithBoundingBox>(query, [collectionId])

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertCollection = (db: Database) => async (
  collectionName: string,
): Promise<Collection | null> => {
  try {
    const query = 'INSERT INTO collections (name) VALUES ($1) RETURNING *'
    const res = await db.query(query, [collectionName])
    const collection = res && res.rows[0] as Collection

    if (!collection) {
      return null
    }

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

    return selectRes ? selectRes.rows[0] as Collection : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const addFramesToCollection = (db: Database) => async (
  collectionId: number,
  frameIds: number[],
): Promise<Collection | null> => {
  try {
    const values = frameIds.map((frameId) => [collectionId, frameId])
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

    return res ? res.rows[0] as Collection : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalCollectionCount = (db: Database) => async (
  filter: string | undefined,
): Promise<number | null> => {
  try {
    let query = 'SELECT count(*) FROM collections'

    if (filter) {
      query += ` WHERE collections.name ILIKE '%${filter}%'`
    }

    const res = await db.query(query)

    return res ? path(['rows', 0, 'count'], res) as number : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getCollectionById = (db: Database) => async (
  id: number,
): Promise<Collection | null> => {
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

    return res ? res.rows[0] as Collection : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteCollectionById = (db: Database) => async (
  id: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM collections WHERE id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getUnlockedFramesByCollectionId = (db: Database) => async (
  id: number,
): Promise<Frame[] | null> => {
  try {
    const query = `
      SELECT * FROM frames
      WHERE frames.id IN (
        SELECT frame_id
        FROM collection_frame
        WHERE collection_id = $1
      )
      AND (locked = false OR locked is null)`

    const res = await db.query<Frame>(query, [id])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getLockedFramesByCollectionId = (db: Database) => async (
  id: number,
): Promise<Frame[] | null> => {
  try {
    const query = `
      SELECT * FROM frames
      WHERE frames.id IN (
        SELECT frame_id
        FROM collection_frame
        WHERE collection_id = $1
      )
      AND locked = true`

    const res = await db.query<Frame>(query, [id])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteCollectionFramesById = (db: Database) => async (
  id: string,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM collection_frame WHERE collection_id = $1'
    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export type CollectionStoreType = {
  deleteCollectionFramesById: ReturnType<typeof deleteCollectionFramesById>,
  deleteCollectionById: ReturnType<typeof deleteCollectionById>,
  getClosestPage: ReturnType<typeof getClosestTimestamp>,
  getCollectionById: ReturnType<typeof getCollectionById>,
  getFramesForCollectionIdWithTags: ReturnType<typeof getFramesForCollectionIdWithTags>,
  insertCollection: ReturnType<typeof insertCollection>,
  getAllCollections: ReturnType<typeof getAllCollections>,
  getFramesForCollectionId: ReturnType<typeof getFramesForCollectionId>,
  addFramesToCollection: ReturnType<typeof addFramesToCollection>,
  getTotalCollectionCount: ReturnType<typeof getTotalCollectionCount>,
  getFramesForCollectionIdWithBboxes: ReturnType<typeof getFramesForCollectionIdWithBboxes>,
  getUnlockedFramesByCollectionId: ReturnType<typeof getUnlockedFramesByCollectionId>,
  getLockedFramesByCollectionId: ReturnType<typeof getLockedFramesByCollectionId>,
}

export default ({ db }: { db: Database }): CollectionStoreType => ({
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
