const getAllStreamInstances = (db) => async () => {
  try {
    const query = "SELECT *, stream_instance.id as id FROM stream_instance JOIN jobs ON stream_instance.running_job_id = jobs.id ORDER BY jobs.creation_date"

    const res = await db.query(query)
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getAllStreamInstancesByUserId = (db) => async (userId) => {
  try {
    const query = `
      SELECT *, stream_instance.id as id
      FROM stream_instance JOIN jobs ON stream_instance.running_job_id = jobs.id
      WHERE jobs.created_by_user_id = $1
      ORDER BY jobs.creation_date
    `

    const res = await db.query(query, [userId])
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteStreamInstanceById = (db) => async (id) => {
  try {
    const query = "DELETE FROM stream_instance WHERE id = $1"

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getStreamInstanceById = (db) => async (id) => {
  try {
    const query = "SELECT *, stream_instance.id as id FROM stream_instance JOIN jobs ON stream_instance.running_job_id = jobs.id WHERE stream_instance.id = $1"

    const res = await db.query(query, [id])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return false
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

const getAllMultiCaptures = (db) => async () => {
  try {
    const query = "SELECT *, multicapture_stream.id as id FROM multicapture_stream JOIN jobs ON multicapture_stream.running_job_id = jobs.id ORDER BY jobs.creation_date"

    const res = await db.query(query)

    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getAllMultiCapturesByUserId = (db) => async (userId) => {
  try {
    const query = `
      SELECT *, multicapture_stream.id as id
      FROM multicapture_stream
      JOIN jobs ON multicapture_stream.running_job_id = jobs.id
      WHERE jobs.created_by_user_id = $1
      ORDER BY jobs.creation_date`

    const res = await db.query(query, [userId])

    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteMultiCaptureById = (db) => async (id) => {
  try {
    const query = "DELETE FROM multicapture_stream WHERE id = $1"

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return null
  }
}

const getMultiCaptureById = (db) => async (id) => {
  try {
    const query = "SELECT * FROM multicapture_stream WHERE id = $1"

    const res = await db.query(query, [id])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

// maby better to not catch errors here, but catch them in the route
const deleteCamerasUsedInMulticaptureStream = (db) => async (id) => {
  const query = "DELETE FROM cameras_used_in_multicapture_stream WHERE multicapture_stream_id = $1"

  await db.query(query, [id])
}


const StreamInstancesStore = (deps) => ({
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

module.exports =  StreamInstancesStore