import { Database } from 'db'
import { Frame } from 'typescript-types'

const insertFrame = (db: Database) => async (
  path: string,
  videoFileId: number,
  timestamp: number,
): Promise<Frame | null> => {
  try {
    const query = `
      INSERT INTO frames (path, video_file_id, timestamp)
      VALUES ($1, $2, $3) RETURNING *`
    const res = await db.query(
      query,
      [
        path,
        videoFileId,
        String(Math.round(timestamp * 1000)),
      ],
    )

    return res ? res.rows[0] as Frame : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getFrameById = (db: Database) => async (
  id: number,
): Promise<Frame | null> => {
  try {
    const query = 'SELECT * FROM frames WHERE id = $1'

    const res = await db.query(query, [id])

    return res ? res.rows[0] as Frame : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteFrameById = (db: Database) => async (
  id: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM frames WHERE id = $1'

    await db.query(query, [id])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getFrameByVideoFileId = (db: Database) => async (
  videoFileId: number,
  skip?: number,
  limit?: number,
): Promise<Frame[] | null> => {
  try {
    const query = `
      SELECT * FROM frames
      WHERE video_file_id = $1
      ORDER BY id
      LIMIT $2
      OFFSET $3`

    const res = await db.query<Frame>(query, [videoFileId, limit, skip])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const updateFrame = (db: Database) => async (
  frameId: number,
  {
    locked,
    path,
  }: {
    locked: boolean,
    path: string,
  },
): Promise<Frame | null> => {
  try {
    const query = 'UPDATE frames SET locked = $1, path = $2 WHERE id = $3 RETURNING *'

    const res = await db.query(query, [locked, path, frameId])
    return res ? res.rows[0] as Frame : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteFrameFromCollections = (db: Database) => async (
  frameId: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM collection_frame WHERE frame_id = $1'

    await db.query(query, [frameId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteFrameMetadata = (db: Database) => async (
  frameId: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM frames_metadata WHERE frames_id = $1'

    await db.query(query, [frameId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export type FrameStoreType = {
  deleteFrameMetadata: ReturnType<typeof deleteFrameMetadata>,
  deleteFrameFromCollections: ReturnType<typeof deleteFrameFromCollections>,
  deleteFrameById: ReturnType<typeof deleteFrameById>,
  updateFrame: ReturnType<typeof updateFrame>,
  insertFrame: ReturnType<typeof insertFrame>,
  getFrameByVideoFileId: ReturnType<typeof getFrameByVideoFileId>,
  getFrameById: ReturnType<typeof getFrameById>,
}

const FrameStore = ({ db }: { db: Database }): FrameStoreType => ({
  deleteFrameMetadata: deleteFrameMetadata(db),
  deleteFrameFromCollections: deleteFrameFromCollections(db),
  deleteFrameById: deleteFrameById(db),
  updateFrame: updateFrame(db),
  insertFrame: insertFrame(db),
  getFrameByVideoFileId: getFrameByVideoFileId(db),
  getFrameById: getFrameById(db),
})

export default FrameStore
