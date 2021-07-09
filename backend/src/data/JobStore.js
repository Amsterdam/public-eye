const R = require('ramda')

const insertJob = (db) => async ({ jobScriptPath, jobScriptPayload, userId }) => {
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
      0
    ])
    return R.path(['rows', 0, 'id'], res) || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const rescheduleJob = (db) => async (id) => {
  try {
    const query = "UPDATE jobs SET job_status = 'scheduled' WHERE id = $1"

    await db.query(query, [id])
  } catch (e) {
    console.error(e)
    return null
  }
}

const updateJobLogPath = (db) => async (jobId, logPath) => {
  try {
    const query = 'UPDATE jobs SET log_path = $1 WHERE id = $2'

    await db.query(query, [logPath, jobId])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const updateJobErrLogPath = (db) => async (jobId, errLogPath) => {
  try {
    const query = 'UPDATE jobs SET err_log_path = $1 WHERE id = $2'

    await db.query(query, [errLogPath, jobId])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const updateJobPid = (db) => async (jobId, pid) => {
  try {
    const query = 'UPDATE jobs SET pid = $1 WHERE id = $2'

    await db.query(query, [pid, jobId])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const updateJobStatus = (db) => async (jobId, newJobStatus) => {
  try {
    const query = 'UPDATE jobs SET job_status = $1 WHERE id = $2'

    await db.query(query, [newJobStatus, jobId])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getJobById = (db) => async (jobId) => {
  try {
    const query = 'SELECT * FROM jobs WHERE id = $1 LIMIT 1'

    const res = await db.query(query, [jobId])
    return (res.rows.length > 0 ? res.rows[0] : null) || null
  } catch (e) {
    console.error(e)
    return null
 }
}

const getJobsWithStatus = (db) => async (jobStatus, numberJobs = 1) => {
  try {
    if (numberJobs < 1) {
      return []
    }
    const query = 'SELECT * FROM jobs WHERE job_status = $1 LIMIT $2'

    const res = await db.query(query, [jobStatus, numberJobs])
    return res.rows || []
  } catch (e) {
    console.error(e)
    return null
 }
}

const getJobs = (db) => async (
  scriptName = null,
  skip,
  limit,
) => {
  try {
    let query = `
      SELECT * FROM jobs
      WHERE (cast($1 as TEXT) IS NULL OR jobs.job_script_path ILIKE $1)
      ORDER BY jobs.creation_date DESC
    `

    if (limit) {
      query += ` LIMIT ${limit}`
    }
    
    if (skip) {
      query += ` OFFSET ${skip}`
    }

    const res = await db.query(query, [scriptName ? `%${scriptName}` : null])

    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
 }
}

const getTotalJobsCount = (db) => async (
  scriptName = null,
) => {
  try {
    const query = `
      SELECT count(*) FROM jobs
      WHERE (cast($1 as TEXT) IS NULL OR jobs.job_script_path ILIKE $1)
    `

    const res = await db.query(query, [scriptName ? `%${scriptName}` : null])
    return res.rows[0].count || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalJobsCountByUserId = (db) => async (
  userId,
  scriptName = null,
) => {
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

    const res = await db.query(query, [userId, scriptName ? `%${scriptName}` : null])
    return res.rows[0].count || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getJobsByUserId = (db) => async (
  userId,
  scriptName = null,
  skip,
  limit,
) => {
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

    const res = await db.query(query, [userId, scriptName ? `%${scriptName}` : null])
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
 }
}

const deleteJobById = (db) => async (id) => {
  try {
    const query = 'DELETE FROM jobs WHERE id = $1 '

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getRunningJobs = (db) => async () => {
  try {
    const query = "SELECT * FROM jobs WHERE job_status = 'running'"

    const res = await db.query(query)
    return res.rows
  } catch (e) {
    console.error(e)
    return null
  }
}

const JobStore = ({db}) => ({
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
  getJobs: getJobs(db)
})

module.exports = JobStore
