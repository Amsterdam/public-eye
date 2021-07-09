const R = require('ramda')

const insertStreamCapture = (db) => async (streamUrl, capturePath) => {
  try {
    const query = 'INSERT INTO stream_capture (stream_url, capture_path) VALUES ($1, $2) RETURNING *'

    const res = await db.query(query, [streamUrl, capturePath])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  } 
}

const  getStreamCaptureById = (db) => async (id) => {
  try {
    const query = 'SELECT * FROM stream_capture WHERE id = $1'

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

const getStreamCaptureByUrl = (db) => async (url) => {
  try {
    const query = 'SELECT * FROM stream_capture WHERE stream_url = $1'

    const res = await db.query(query, [url])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  } 
}

const insertCalibration = (db) => async (streamCaptureId, { a, b, c, d, scaling_factor, }) => {
  try {
    const calibrationExists = await db.query("SELECT * FROM calibration WHERE stream_capture_id = $1", [streamCaptureId])

    if (calibrationExists.rows.length === 0) {
      const query = 'INSERT INTO calibration (stream_capture_id, matrix_a, matrix_b, matrix_c, matrix_d, scaling_factor) VALUES ($1, $2, $3, $4, $5, $6)'
      await db.query(query, [streamCaptureId, a, b, c, d, scaling_factor])
    } else {
      const query = 'UPDATE calibration SET matrix_a = $1, matrix_b = $2, matrix_c = $3, matrix_d = $4, scaling_factor = $5 WHERE stream_capture_id = $6'
      await db.query(query, [a, b, c, d, scaling_factor, streamCaptureId])
    }

    return true
  } catch (e) {
    console.error(e)
    return null
  } 
}

const insertRegionOfInterest = (db) => async (streamCaptureId, { polygons, name, } ) => {
  try {
    const query = 'INSERT INTO stream_roi (stream_capture_id, polygons, name) VALUES ($1, $2, $3)'

    await db.query(query, [streamCaptureId, polygons, name])
    return true
  } catch (e) {
    console.error(e)
    return null
  } 
}

const retrieveRegionOfInterest = (db) => async (streamCaptureId) => {
  try {
    const query = 'SELECT * FROM stream_roi WHERE stream_capture_id = $1'

    const res = await db.query(query, [streamCaptureId])
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  } 
}

const insertLineOfInterest = (db) => async (streamCaptureId, { polygons, name, } ) => {
  try {
    const query = 'INSERT INTO stream_loi (stream_capture_id, polygons, name) VALUES ($1, $2, $3)'

    await db.query(query, [streamCaptureId, polygons, name])
    return true
  } catch (e) {
    console.error(e)
    return null
  } 
}

const retrieveLineOfInterest = (db) => async (streamCaptureId) => {
  try {
    const query = 'SELECT * FROM stream_loi WHERE stream_capture_id = $1'

    const res = await db.query(query, [streamCaptureId])
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  } 
}

const StreamCaptureStore = ({db}) => ({
  retrieveRegionOfInterest: retrieveRegionOfInterest(db),
  insertRegionOfInterest: insertRegionOfInterest(db),
  retrieveLineOfInterest: retrieveLineOfInterest(db),
  insertLineOfInterest: insertLineOfInterest(db),
  insertCalibration: insertCalibration(db),
  getStreamCaptureByUrl: getStreamCaptureByUrl(db),
  updateCapturePath: updateCapturePath(db),
  insertStreamCapture: insertStreamCapture(db),
  getStreamCaptureById:  getStreamCaptureById(db),
})

module.exports = StreamCaptureStore