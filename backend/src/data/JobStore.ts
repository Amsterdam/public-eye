import { Database } from 'db'
import {
  path,
} from 'ramda'
import { Job } from 'typescript-types'

const insertJob = (db: Database) => async (
  {
    jobScriptPath,
    jobScriptPayload,
    userId,
  }: {
    jobScriptPath: string,
    jobScriptPayload: string,
    userId: number,
  },
): Promise<number | null> => {
  try {
    const query = `
      INSERT INTO jobs (
        job_script_path,
        job_script_payload,
        created_by_user_id,
        creation_date,
        job_status,
        pid
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`

    const res = await db.query(query, [
      jobScriptPath,
      jobScriptPayload,
      userId,
      Date.now(),
      'scheduled',
      0,
    ])
    return await path(['rows', 0, 'id'], res) || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const rescheduleJob = (db: Database) => async (
  id: number,
): Promise<boolean> => {
  try {
    const query = "UPDATE jobs SET job_status = 'scheduled' WHERE id = $1"

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const updateJobLogPath = (db: Database) => async (
  jobId: number,
  logPath: string,
) => {
  try {
    const query = 'UPDATE jobs SET log_path = $1 WHERE id = $2'

    await db.query(query, [logPath, jobId])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const updateJobErrLogPath = (db: Database) => async (
  jobId: number,
  errLogPath: string,
) => {
  try {
    const query = 'UPDATE jobs SET err_log_path = $1 WHERE id = $2'

    await db.query(query, [errLogPath, jobId])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const updateJobPid = (db: Database) => async (
  jobId: number,
  pid: number,
) => {
  try {
    const query = 'UPDATE jobs SET pid = $1 WHERE id = $2'

    await db.query(query, [pid, jobId])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const updateJobStatus = (db: Database) => async (
  jobId: number,
  newJobStatus: string,
) => {
  try {
    const query = 'UPDATE jobs SET job_status = $1 WHERE id = $2'

    await db.query(query, [newJobStatus, jobId])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getJobById = (db: Database) => async (
  jobId: number,
): Promise<Job | null> => {
  try {
    const query = 'SELECT * FROM jobs WHERE id = $1 LIMIT 1'

    const res = await db.query(query, [jobId])
    return (res && res.rows.length > 0 ? res.rows[0] as Job : null) || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getJobsWithStatus = (db: Database) => async (
  jobStatus: string,
  numberJobs = 1,
): Promise<Job[] | null> => {
  try {
    if (numberJobs < 1) {
      return null
    }
    const query = 'SELECT * FROM jobs WHERE job_status = $1 LIMIT $2'

    const res = await db.query(query, [jobStatus, String(numberJobs)])
    return res ? res.rows as Job[] : []
  } catch (e) {
    console.error(e)
    return null
  }
}

const getJobs = (db: Database) => async (
  scriptName?: string,
  skip?: number,
  limit?: number,
) => {
  try {
    let query = `
      SELECT * FROM jobs
      WHERE (cast($1 as TEXT) IS NULL OR jobs.job_script_path ILIKE $1)
      ORDER BY jobs.creation_date DESC
    `

    if (limit !== undefined) {
      query += ` LIMIT ${limit}`
    }

    if (skip !== undefined) {
      query += ` OFFSET ${skip}`
    }

    const res = await db.query(query, [scriptName ? `%${scriptName}` : null])

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalJobsCount = (db: Database) => async (
  scriptName?: string,
): Promise<number | null> => {
  try {
    const query = `
      SELECT count(*) FROM jobs
      WHERE (cast($1 as TEXT) IS NULL OR jobs.job_script_path ILIKE $1)
    `

    const res = await db.query(
      query,
      [scriptName ? `%${String(scriptName)}` : null],
    )
    return res ? path(['rows', 0, 'count'], res) as number : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalJobsCountByUserId = (db: Database) => async (
  userId: number,
  scriptName?: string,
): Promise<number | null> => {
  try {
    const query = `
      SELECT count(*) FROM jobs
      WHERE (
        jobs.created_by_user_id = $1
        AND (
          cast($2 as TEXT) IS NULL OR jobs.job_script_path ILIKE $2
        )
      )
    `

    const res = await db.query(
      query,
      [
        userId,
        scriptName ? `%${String(scriptName)}` : null,
      ],
    )
    return res ? path(['rows', 0, 'count'], res) as number : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getJobsByUserId = (db: Database) => async (
  userId: number,
  scriptName?: string,
  skip?: number,
  limit?: number,
): Promise<Job[] | null> => {
  try {
    let query = `
      SELECT * FROM jobs
      WHERE (
        jobs.created_by_user_id = $1
        AND (
          cast($2 as TEXT) IS NULL OR jobs.job_script_path ILIKE $2
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

    const res = await db.query<Job>(
      query,
      [
        userId,
        scriptName ? `%${String(scriptName)}` : null,
      ],
    )
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteJobById = (db: Database) => async (id: number) => {
  try {
    const query = 'DELETE FROM jobs WHERE id = $1 '

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getRunningJobs = (db: Database) => async (): Promise<Job[] | null> => {
  try {
    const query = "SELECT * FROM jobs WHERE job_status = 'running'"

    const res = await db.query<Job>(query)
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

export type JobStoreType = {
  getTotalJobsCountByUserId: ReturnType<typeof getTotalJobsCountByUserId>,
  getTotalJobsCount: ReturnType<typeof getTotalJobsCount>,
  getJobsByUserId: ReturnType<typeof getJobsByUserId>,
  getRunningJobs: ReturnType<typeof getRunningJobs>,
  rescheduleJob: ReturnType<typeof rescheduleJob>,
  deleteJobById: ReturnType<typeof deleteJobById>,
  insertJob: ReturnType<typeof insertJob>,
  getJobsWithStatus: ReturnType<typeof getJobsWithStatus>,
  getJobById: ReturnType<typeof getJobById>,
  updateJobStatus: ReturnType<typeof updateJobStatus>,
  updateJobPid: ReturnType<typeof updateJobPid>,
  updateJobErrLogPath: ReturnType<typeof updateJobErrLogPath>,
  updateJobLogPath: ReturnType<typeof updateJobLogPath>,
  getJobs: ReturnType<typeof getJobs>,
}

const JobStore = ({ db }: { db: Database }): JobStoreType => ({
  getTotalJobsCountByUserId: getTotalJobsCountByUserId(db),
  getTotalJobsCount: getTotalJobsCount(db),
  getJobsByUserId: getJobsByUserId(db),
  getRunningJobs: getRunningJobs(db),
  rescheduleJob: rescheduleJob(db),
  deleteJobById: deleteJobById(db),
  insertJob: insertJob(db),
  getJobsWithStatus: getJobsWithStatus(db),
  getJobById: getJobById(db),
  updateJobStatus: updateJobStatus(db),
  updateJobPid: updateJobPid(db),
  updateJobErrLogPath: updateJobErrLogPath(db),
  updateJobLogPath: updateJobLogPath(db),
  getJobs: getJobs(db),
})

export default JobStore
