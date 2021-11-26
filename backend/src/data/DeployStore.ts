import { path } from 'ramda'
import { Database } from 'db'
import { Deploy, MultiCapture } from 'typescript-types'

const getDeployByJobId = (db: Database) => async (
  id: number,
): Promise<Deploy | null> => {
  try {
    const query = `
      SELECT *, jobs.id as id FROM jobs
      LEFT JOIN multicapture_stream
        ON multicapture_stream.running_job_id = jobs.id
      LEFT JOIN video_capture
        ON video_capture.running_job_id = jobs.id
      LEFT JOIN stream_instance
        ON stream_instance.running_job_id = jobs.id

      WHERE (
        jobs.id = $1 AND (
          jobs.job_script_path LIKE '%capture_camera%'
          OR jobs.job_script_path LIKE '%stream_multicapture.py%'
          OR jobs.job_script_path LIKE '%stream_capture.py%'
        )
      )
    `
    const res = await db.query(query, [id])

    return res ? res.rows[0] as Deploy : null
  } catch (e) {
    return null
  }
}

const getDeploys = (db: Database) => async (
  skip?: number,
  limit?: number,
): Promise<Deploy[] | null> => {
  try {
    let query = `
      SELECT *, jobs.id as id FROM jobs
      LEFT JOIN stream_instance
        ON stream_instance.running_job_id = jobs.id
      LEFT JOIN multicapture_stream
        ON multicapture_stream.running_job_id = jobs.id
      LEFT JOIN video_capture
        ON video_capture.running_job_id = jobs.id

      WHERE (
        jobs.job_script_path LIKE '%capture_camera%'
        OR jobs.job_script_path LIKE '%stream_multicapture.py%'
        OR jobs.job_script_path LIKE '%stream_capture.py%'
      )

      ORDER BY jobs.creation_date DESC
    `

    if (limit) {
      query += ` LIMIT ${limit}`
    }

    if (skip) {
      query += ` OFFSET ${skip}`
    }

    const res = await db.query<Deploy>(query)

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalDeploysCount = (db: Database) => async (): Promise<number | null> => {
  try {
    const query = `
      SELECT count(*) FROM jobs

      WHERE (
        jobs.job_script_path LIKE '%capture_camera%'
        OR jobs.job_script_path LIKE '%stream_multicapture.py%'
        OR jobs.job_script_path LIKE '%stream_capture.py%'
      )
    `

    const res = await db.query(query, [])
    return res ? path(['rows', 0, 'count'], res) as number : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalDeploysCountByUserId = (db: Database) => async (
  userId: number,
): Promise<number | null> => {
  try {
    const query = `
      SELECT count(*) FROM jobs

      WHERE (
        (
          jobs.job_script_path LIKE '%capture_camera%'
          OR jobs.job_script_path LIKE '%stream_multicapture.py%'
          OR jobs.job_script_path LIKE '%stream_capture.py%'
        ) AND jobs.created_by_user_id = $1
      )
    `

    const res = await db.query(query, [userId])
    return res ? path(['rows', 0, 'count'], res) as number : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getDeploysByUserId = (db: Database) => async (
  userId: number,
  skip?: number,
  limit?: number,
): Promise<Deploy[] | null> => {
  try {
    let query = `
      SELECT *, jobs.id as id FROM jobs
      LEFT JOIN stream_instance
        ON stream_instance.running_job_id = jobs.id
      LEFT JOIN multicapture_stream
        ON multicapture_stream.running_job_id = jobs.id

      WHERE (
        jobs.created_by_user_id = $1
        AND (
          jobs.job_script_path LIKE '%capture_camera%'
          OR jobs.job_script_path LIKE '%stream_multicapture.py%'
          OR jobs.job_script_path LIKE '%stream_capture.py%'
        )
      )

      ORDER BY jobs.creation_date DESC
    `

    if (limit) {
      query += ` LIMIT ${limit}`
    }

    if (skip) {
      query += ` OFFSET ${skip}`
    }

    const res = await db.query<Deploy>(query, [userId])

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteStreamInstanceByJobId = (db: Database) => async (
  id: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM stream_instance WHERE running_job_id = $1'

    await db.query(query, [id])
    return false
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteMultiCaptureByJobId = (db: Database) => async (
  id: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM multicapture_stream WHERE running_job_id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteCamerasUsedInMulticaptureStream = (db: Database) => async (
  id: number,
): Promise<void> => {
  const query = `
    DELETE FROM cameras_used_in_multicapture_stream

    WHERE multicapture_stream_id = $1
  `

  await db.query(query, [id])
}

const getMultiCaptureByJobId = (db: Database) => async (
  id: number,
): Promise<MultiCapture | null> => {
  try {
    const query = `
      SELECT * FROM multicapture_stream
      WHERE running_job_id = $1
    `

    const res = await db.query(query, [id])
    return res ? res.rows[0] as MultiCapture : null
  } catch (e) {
    console.error(e)
    return null
  }
}

export type DeployStoreType = {
  getDeployByJobId: ReturnType<typeof getDeployByJobId>,
  getTotalDeploysCount: ReturnType<typeof getTotalDeploysCount>,
  getTotalDeploysCountByUserId: ReturnType<typeof getTotalDeploysCountByUserId>,
  getDeploysByUserId: ReturnType<typeof getDeploysByUserId>,
  getMultiCaptureByJobId: ReturnType<typeof getMultiCaptureByJobId>,
  deleteCamerasUsedInMulticaptureStream: ReturnType<typeof deleteCamerasUsedInMulticaptureStream>,
  getDeploys: ReturnType<typeof getDeploys>,
  deleteStreamInstanceByJobId: ReturnType<typeof deleteStreamInstanceByJobId>,
  deleteMultiCaptureByJobId: ReturnType<typeof deleteMultiCaptureByJobId>,
}

const DeployStore = ({ db }: { db: Database }): DeployStoreType => ({
  getDeployByJobId: getDeployByJobId(db),
  getTotalDeploysCount: getTotalDeploysCount(db),
  getTotalDeploysCountByUserId: getTotalDeploysCountByUserId(db),
  getDeploysByUserId: getDeploysByUserId(db),
  getMultiCaptureByJobId: getMultiCaptureByJobId(db),
  deleteCamerasUsedInMulticaptureStream: deleteCamerasUsedInMulticaptureStream(db),
  getDeploys: getDeploys(db),
  deleteStreamInstanceByJobId: deleteStreamInstanceByJobId(db),
  deleteMultiCaptureByJobId: deleteMultiCaptureByJobId(db),
})

export default DeployStore
