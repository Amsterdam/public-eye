import { Database } from 'db'
import {
  StreamInstance,
  MultiCapture,
} from 'typescript-types'

const getAllStreamInstances = (db: Database) => async () => {
  try {
    const query = 'SELECT *, stream_instance.id as id FROM stream_instance JOIN jobs ON stream_instance.running_job_id = jobs.id ORDER BY jobs.creation_date'

    const res = await db.query(query)
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getAllStreamInstancesByUserId = (db: Database) => async (
  userId: number,
) => {
  try {
    const query = `
      SELECT *, stream_instance.id as id
      FROM stream_instance JOIN jobs ON stream_instance.running_job_id = jobs.id
      WHERE jobs.created_by_user_id = $1
      ORDER BY jobs.creation_date
    `

    const res = await db.query(query, [userId])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteStreamInstanceById = (db: Database) => async (
  id: number,
) => {
  try {
    const query = 'DELETE FROM stream_instance WHERE id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getStreamInstanceById = (db: Database) => async (
  id: number,
): Promise<StreamInstance | null> => {
  try {
    const query = 'SELECT *, stream_instance.id as id FROM stream_instance JOIN jobs ON stream_instance.running_job_id = jobs.id WHERE stream_instance.id = $1'

    const res = await db.query(query, [id])
    return res ? res.rows[0] as StreamInstance : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteStreamInstanceByJobId = (db: Database) => async (
  id: string,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM stream_instance WHERE running_job_id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getAllMultiCaptures = (db: Database) => async () => {
  try {
    const query = 'SELECT *, multicapture_stream.id as id FROM multicapture_stream JOIN jobs ON multicapture_stream.running_job_id = jobs.id ORDER BY jobs.creation_date'

    const res = await db.query(query)

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getAllMultiCapturesByUserId = (db: Database) => async (
  userId: number,
) => {
  try {
    const query = `
      SELECT *, multicapture_stream.id as id
      FROM multicapture_stream
      JOIN jobs ON multicapture_stream.running_job_id = jobs.id
      WHERE jobs.created_by_user_id = $1
      ORDER BY jobs.creation_date`

    const res = await db.query(query, [userId])

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteMultiCaptureById = (db: Database) => async (
  id: number,
) => {
  try {
    const query = 'DELETE FROM multicapture_stream WHERE id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return null
  }
}

const getMultiCaptureById = (db: Database) => async (
  id: number,
): Promise<MultiCapture | null> => {
  try {
    const query = 'SELECT * FROM multicapture_stream WHERE id = $1'

    const res = await db.query(query, [id])
    return res ? res.rows[0] as MultiCapture : null
  } catch (e) {
    console.error(e)
    return null
  }
}

// maby better to not catch errors here, but catch them in the route
const deleteCamerasUsedInMulticaptureStream = (db: Database) => async (
  id: number,
) => {
  const query = 'DELETE FROM cameras_used_in_multicapture_stream WHERE multicapture_stream_id = $1'

  await db.query(query, [id])
}

export type StreamInstanceStoreType = {
  getAllStreamInstancesByUserId: ReturnType<typeof getAllStreamInstancesByUserId>,
  getAllMultiCapturesByUserId: ReturnType<typeof getAllMultiCapturesByUserId>,
  deleteCamerasUsedInMulticaptureStream: ReturnType<typeof deleteCamerasUsedInMulticaptureStream>,
  getMultiCaptureById: ReturnType<typeof getMultiCaptureById>,
  deleteMultiCaptureById: ReturnType<typeof deleteMultiCaptureById>,
  getStreamInstanceById: ReturnType<typeof getStreamInstanceById>,
  getAllStreamInstances: ReturnType<typeof getAllStreamInstances>,
  deleteStreamInstanceById: ReturnType<typeof deleteStreamInstanceById>,
  deleteStreamInstanceByJobId: ReturnType<typeof deleteStreamInstanceByJobId>,
  getAllMultiCaptures: ReturnType<typeof getAllMultiCaptures>,
}

const StreamInstancesStore = (deps: { db: Database }): StreamInstanceStoreType => ({
  getAllStreamInstancesByUserId: getAllStreamInstancesByUserId(deps.db),
  getAllMultiCapturesByUserId: getAllMultiCapturesByUserId(deps.db),
  deleteCamerasUsedInMulticaptureStream: deleteCamerasUsedInMulticaptureStream(deps.db),
  getMultiCaptureById: getMultiCaptureById(deps.db),
  deleteMultiCaptureById: deleteMultiCaptureById(deps.db),
  getStreamInstanceById: getStreamInstanceById(deps.db),
  getAllStreamInstances: getAllStreamInstances(deps.db),
  deleteStreamInstanceById: deleteStreamInstanceById(deps.db),
  deleteStreamInstanceByJobId: deleteStreamInstanceByJobId(deps.db),
  getAllMultiCaptures: getAllMultiCaptures(deps.db),
})

export default StreamInstancesStore
