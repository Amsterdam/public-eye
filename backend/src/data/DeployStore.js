const getDeploys = (db) => async (skip, limit) => {
  try {
    let query = `
      SELECT *, jobs.id as id FROM jobs
      LEFT JOIN stream_instance
        ON stream_instance.running_job_id = jobs.id
      LEFT JOIN multicapture_stream
        ON multicapture_stream.running_job_id = jobs.id

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

    const res = await db.query(query)

    return res.rows || null
  } catch(e) {
    console.error(e)
    return null
  }
}

const getTotalDeploysCount = (db) => async () => {
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
    return res.rows[0].count || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalDeploysCountByUserId = (db) => async (userId) => {
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
    return res.rows[0].count || null
  } catch (e) {
    console.error(e)
    return null
  }
}


const getDeploysByUserId = (db) => async (userId, skip, limit) => {
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

    const res = await db.query(query, [userId])

    return res.rows || null
  } catch(e) {
    console.error(e)
    return null
  }
}

const deleteStreamInstanceByJobId = (db) => async (id) => {
  try {
    const query = "DELETE FROM stream_instance WHERE running_job_id = $1"

    await db.query(query, [id])
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteMultiCaptureByJobId = (db) => async (id) => {
  try {
    const query = "DELETE FROM multicapture_stream WHERE running_job_id = $1"

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteCamerasUsedInMulticaptureStream = (db) => async (id) => {
  const query = `
    DELETE FROM cameras_used_in_multicapture_stream

    WHERE multicapture_stream_id = $1
  `

  await db.query(query, [id])
}

const getMultiCaptureByJobId = (db) => async (id) => {
  try {
    const query = `
      SELECT * FROM multicapture_stream
      WHERE running_job_id = $1
    `

    const res = await db.query(query, [id])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const DatasetStore = ({ db }) => ({
  getTotalDeploysCount: getTotalDeploysCount(db),
  getTotalDeploysCountByUserId: getTotalDeploysCountByUserId(db),
  getDeploysByUserId: getDeploysByUserId(db),
  getMultiCaptureByJobId: getMultiCaptureByJobId(db),
  deleteCamerasUsedInMulticaptureStream: deleteCamerasUsedInMulticaptureStream(db),
  getDeploys: getDeploys(db),
  deleteStreamInstanceByJobId: deleteStreamInstanceByJobId(db),
  deleteMultiCaptureByJobId: deleteMultiCaptureByJobId(db),
})
  
module.exports = DatasetStore
