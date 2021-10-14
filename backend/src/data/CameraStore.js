const getAllCameras = (db) => async () => {
  try {
    const query = 'SELECT * FROM camera'
    const res = await db.query(query)

    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const updateCamera = (db) => async (id, { name, stream_url, azimuth, supplier, geo_long, geo_lat, fps, area_size_m2 }) => {
  try {
    const query = 'UPDATE camera SET stream_url = $2, azimuth = $3, supplier = $4, geo_long = $5, geo_lat = $6, name = $7, fps = $8, area_size_m2 = $9 WHERE id = $1 RETURNING *'

    const res = await db.query(
      query,
      [
        id,
        stream_url,
        azimuth,
        supplier,
        geo_long,
        geo_lat,
        name,
        fps,
        area_size_m2 || null,
      ],
    )
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return false
  }
}

const getStreamCapture = (db) => async (cameraId) => {
  try {
    const query = 'SELECT * FROM stream_capture WHERE camera_id = $1'

    const res = await db.query(query, [cameraId])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return false
  }
}

const insertCamera = (db) => async ({ name, stream_url, azimuth, supplier, geo_long, geo_lat, fps, area_size_m2 }) => {
  try {
    const query = 'INSERT INTO camera (name, stream_url, azimuth, supplier, geo_long, geo_lat, fps, area_size_m2) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *'

    const res = await db.query(
      query, [
        name,
        stream_url,
        azimuth,
        supplier,
        geo_long, 
        geo_lat,
        fps,
        area_size_m2 || null,
      ])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getCameraById = (db) => async (id) => {
  try {
    const query = 'SELECT * FROM camera WHERE id = $1'

    const res = await db.query(query, [id])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getStreamCaptureByCameraId = (db) => async (id) => {
  try {
    const query = 'SELECT * FROM stream_capture WHERE camera_id = $1'

    const res = await db.query(query, [id])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  } 
}

const updateCapturePath = (db) => async (id, capturePath) => {
  try {
    const query = 'UPDATE stream_capture SET capture_path = $1 WHERE id = $2 RETURNING *'

    const res = await db.query(query, [capturePath, id])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  } 
}

const insertStreamCapture = (db) => async (cameraId, capturePath) => {
  try {
    const query = 'INSERT INTO stream_capture (camera_id, capture_path) VALUES ($1, $2) RETURNING *'

    const res = await db.query(query, [cameraId, capturePath])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  } 
}

const insertRegionOfInterest = (db) => async (cameraId, { polygons, name, } ) => {
  try {
    const query = 'INSERT INTO stream_roi (camera_id, polygons, name) VALUES ($1, $2, $3) RETURNING *'

    const res = await db.query(query, [cameraId, polygons, name])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  } 
}

const retrieveRegionOfInterest = (db) => async (cameraId) => {
  try {
    const query = 'SELECT * FROM stream_roi WHERE camera_id = $1'

    const res = await db.query(query, [cameraId])
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  } 
}

const updateRegionOfInterest = (db) => async (id, { polygons }) => {
  try {
    const query = 'UPDATE stream_roi SET polygons = $2 WHERE id = $1 RETURNING *'

    const res = await db.query(query, [id, polygons])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return false
  }
}

const getRegionOfInterestById = (db) => async (id) => {
  try {
    const query = 'SELECT * FROM stream_roi WHERE id = $1'
    const res = await db.query(query, [id])

    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return false
  } 
}

const deleteRegionOfInterest = (db) => async (id) => {
  try {
    const query = 'DELETE FROM stream_roi WHERE id = $1'
    await db.query(query, [id])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteCamera = (db) => async (id) => {
  try {
    const query = 'DELETE FROM camera WHERE id = $1'
    await db.query(query, [id])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const insertCalibration = (db) => async (cameraId, { a, b, c, d, scaling_factor, }) => {
  try {
    const calibrationExists = await db.query("SELECT * FROM calibration WHERE camera_id = $1", [cameraId])

    if (calibrationExists.rows.length === 0) {
      const query = 'INSERT INTO calibration (camera_id, matrix_a, matrix_b, matrix_c, matrix_d, scaling_factor) VALUES ($1, $2, $3, $4, $5, $6)'
      await db.query(query, [cameraId, a, b, c, d, scaling_factor])
    } else {
      const query = 'UPDATE calibration SET matrix_a = $1, matrix_b = $2, matrix_c = $3, matrix_d = $4, scaling_factor = $5 WHERE camera_id = $6'
      await db.query(query, [a, b, c, d, scaling_factor, cameraId])
    }

    return true
  } catch (e) {
    console.error(e)
    return null
  } 
}

const deleteStreamCaptureById = (db) => async (id) => {
  try {
    const query = 'DELETE FROM stream_capture WHERE id = $1'

    await db.query(query, [id])
  } catch (e) {
    console.error(e)

    throw e
  }
}

const getStreamInstancesByCameraId = (db) => async (id) => {
  try {
    const query = 'SELECT * FROM stream_instance WHERE camera_id = $1'

    const res = await db.query(query, [id])
    return res.rows
  } catch (e) {
    console.error(e)

    throw e
  }
}

const getMultiCaptureStreamsByCameraId = (db) => async (id) => {
  try {
    const query = `
      SELECT multicapture_stream.* FROM multicapture_stream
      JOIN cameras_used_in_multicapture_stream ON cameras_used_in_multicapture_stream.multicapture_stream_id = multicapture_stream.id
      WHERE cameras_used_in_multicapture_stream.camera_id = $1`

    const res = await db.query(query, [id])
    return res.rows
  } catch (e) {
    console.error(e)

    throw e
  }
}

const deleteRoisByCameraId = (db) => async (cameraId) => {
  try {
    const query = 'DELETE FROM stream_roi WHERE camera_id = $1'

    await db.query(query, [cameraId])
  } catch (e) {
    console.error(e)

    throw e
  }
}

const deleteCalibrationByCameraId = (db) => async (cameraId) => {
  try {
    const query = 'DELETE FROM calibration WHERE camera_id = $1'

    await db.query(query, [cameraId])
  } catch (e) {
    console.error(e)

    throw e
  }
}

const insertLineOfInterest = (db) => async (cameraId, { polygons, name, } ) => {
  try {
    const query = 'INSERT INTO stream_loi (camera_id, polygons, name) VALUES ($1, $2, $3) RETURNING *'

    const res = await db.query(query, [cameraId, polygons, name])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const retrieveLinesOfInterest = (db) => async (cameraId) => {
  try {
    const query = 'SELECT * FROM stream_loi WHERE camera_id = $1'

    const res = await db.query(query, [cameraId])
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteLineOfInterest = (db) => async (id) => {
  try {
    const query = 'DELETE FROM stream_loi WHERE id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteLoisByCameraId = (db) => async (cameraId) => {
  try {
    const query = 'DELETE FROM stream_loi WHERE camera_id = $1'

    await db.query(query, [cameraId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getVideosByCameraId = (db) => async (cameraId) => {
  try {
    const query = `
      SELECT video_files.* FROM video_files
      JOIN video_captured_by_camera ON video_files.id = video_captured_by_camera.video_file_id
      WHERE camera_id = $1
    `

    const res = await db.query(query, [cameraId])

    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const CameraStore = ({db}) => ({
  getVideosByCameraId: getVideosByCameraId(db),
  getMultiCaptureStreamsByCameraId: getMultiCaptureStreamsByCameraId(db),
  deleteLoisByCameraId: deleteLoisByCameraId(db),
  deleteLineOfInterest: deleteLineOfInterest(db),
  retrieveLinesOfInterest: retrieveLinesOfInterest(db),
  insertLineOfInterest: insertLineOfInterest(db),
  deleteCalibrationByCameraId: deleteCalibrationByCameraId(db),
  deleteRoisByCameraId: deleteRoisByCameraId(db),
  getStreamInstancesByCameraId: getStreamInstancesByCameraId(db),
  deleteStreamCaptureById: deleteStreamCaptureById(db),
  insertCalibration: insertCalibration(db),
  deleteCamera: deleteCamera(db),
  deleteRegionOfInterest: deleteRegionOfInterest(db),
  getRegionOfInterestById: getRegionOfInterestById(db),
  updateRegionOfInterest: updateRegionOfInterest(db),
  retrieveRegionOfInterest: retrieveRegionOfInterest(db),
  insertRegionOfInterest: insertRegionOfInterest(db),
  insertStreamCapture: insertStreamCapture(db),
  updateCapturePath: updateCapturePath(db),
  getStreamCaptureByCameraId: getStreamCaptureByCameraId(db),
  getCameraById: getCameraById(db),
  insertCamera: insertCamera(db),
  getStreamCapture: getStreamCapture(db),
  updateCamera: updateCamera(db),
  getAllCameras: getAllCameras(db),
})

module.exports = CameraStore
