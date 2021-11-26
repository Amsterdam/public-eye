import { path } from 'ramda'
import { Database } from 'db'
import { BoundingBox } from 'typescript-types'

const insertBoundingBox = (db: Database) => async ({
  frameId,
  labelId,
  x,
  y,
  w,
  h,
}: {
  frameId: number,
  labelId: number,
  x: number,
  y: number,
  w: number,
  h: number,
}): Promise<BoundingBox | null> => {
  try {
    const insertQuery = 'INSERT INTO bounding_boxes (frame_id, label_id, x, y, w, h) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'
    const insertRes = await db.query(insertQuery, [frameId, labelId, x, y, w, h])

    if (!insertRes) {
      return null
    }
    const id = path(['rows', 0, 'id'], insertRes)
    const selectQuery = 'SELECT bounding_boxes.id as bb_id, * FROM bounding_boxes JOIN labels ON bounding_boxes.label_id=labels.id WHERE bounding_boxes.id = $1'
    const res = await db.query(selectQuery, [id])
    return res ? res.rows[0] as BoundingBox : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getBoundingBoxesByFrameId = (db: Database) => async (
  frameId: number,
): Promise<BoundingBox[] | null> => {
  try {
    const query = 'SELECT bounding_boxes.id as bb_id, * FROM bounding_boxes JOIN labels ON bounding_boxes.label_id=labels.id WHERE bounding_boxes.frame_id = $1'
    const res = await db.query<BoundingBox>(query, [frameId])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteBoundingBox = (db: Database) => async (
  boundingBoxId: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM bounding_boxes WHERE id = $1'
    await db.query(query, [boundingBoxId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const updateBoundingBoxLabel = (db: Database) => async (
  boundingBoxId: number,
  labelId: number,
): Promise<BoundingBox | null> => {
  try {
    const insertQuery = 'UPDATE bounding_boxes SET label_id = $1 WHERE id = $2 RETURNING *'
    const insertRes = await db.query(insertQuery, [labelId, boundingBoxId])
    const id = path(['rows', 0, 'id'], insertRes)
    const selectQuery = 'SELECT bounding_boxes.id as bb_id, * FROM bounding_boxes JOIN labels ON bounding_boxes.label_id=labels.id WHERE bounding_boxes.id = $1'
    const res = await db.query(selectQuery, [id])
    return res ? res.rows[0] as BoundingBox : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteBoundingBoxesByFrameId = (db: Database) => async (
  frameId: string,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM bounding_boxes WHERE frame_id = $1'

    await db.query(query, [frameId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export type BoundingBoxStoreType = {
  deleteBoundingBoxesByFrameId: ReturnType<typeof deleteBoundingBoxesByFrameId>,
  updateBoundingBoxLabel: ReturnType<typeof updateBoundingBoxLabel>,
  deleteBoundingBox: ReturnType<typeof deleteBoundingBox>,
  insertBoundingBox: ReturnType<typeof insertBoundingBox>,
  getBoundingBoxesByFrameId: ReturnType<typeof getBoundingBoxesByFrameId>,
}

const BoundingBoxStore = ({ db }: { db: Database }): BoundingBoxStoreType => ({
  deleteBoundingBoxesByFrameId: deleteBoundingBoxesByFrameId(db),
  updateBoundingBoxLabel: updateBoundingBoxLabel(db),
  deleteBoundingBox: deleteBoundingBox(db),
  insertBoundingBox: insertBoundingBox(db),
  getBoundingBoxesByFrameId: getBoundingBoxesByFrameId(db),
})

export default BoundingBoxStore
