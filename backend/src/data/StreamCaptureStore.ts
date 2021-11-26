import { Database } from 'db'
import {
  LoiPolygon,
  RoiPolygon,
  StreamCapture,
} from 'typescript-types'

const insertStreamCapture = (db: Database) => async (
  streamUrl: string,
  capturePath: string,
): Promise<StreamCapture | null> => {
  try {
    const query = 'INSERT INTO stream_capture (stream_url, capture_path) VALUES ($1, $2) RETURNING *'

    const res = await db.query(query, [streamUrl, capturePath])
    return res ? res.rows[0] as StreamCapture : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getStreamCaptureById = (db: Database) => async (
  id: number,
): Promise<StreamCapture | null> => {
  try {
    const query = 'SELECT * FROM stream_capture WHERE id = $1'

    const res = await db.query(query, [id])
    return res ? res.rows[0] as StreamCapture : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const updateCapturePath = (db: Database) => async (
  id: number,
  capturePath: string,
): Promise<StreamCapture | null> => {
  try {
    const query = 'UPDATE stream_capture SET capture_path = $1 WHERE id = $2 RETURNING *'

    const res = await db.query(query, [capturePath, id])
    return res ? res.rows[0] as StreamCapture : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getStreamCaptureByUrl = (db: Database) => async (
  url: string,
): Promise<StreamCapture | null> => {
  try {
    const query = 'SELECT * FROM stream_capture WHERE stream_url = $1'

    const res = await db.query(query, [url])
    return res ? res.rows[0] as StreamCapture : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertCalibration = (db: Database) => async (
  streamCaptureId: number,
  {
    a,
    b,
    c,
    d,
    scaling_factor,
  }: {
    a: number,
    b: number,
    c: number,
    d: number,
    scaling_factor: number,
  },
) => {
  try {
    const calibrationExists = await db.query(
      'SELECT * FROM calibration WHERE stream_capture_id = $1',
      [streamCaptureId],
    )

    if (calibrationExists && calibrationExists.rows.length === 0) {
      const query = 'INSERT INTO calibration (stream_capture_id, matrix_a, matrix_b, matrix_c, matrix_d, scaling_factor) VALUES ($1, $2, $3, $4, $5, $6)'
      await db.query(
        query,
        [streamCaptureId, a, b, c, d, scaling_factor],
      )
    } else {
      const query = 'UPDATE calibration SET matrix_a = $1, matrix_b = $2, matrix_c = $3, matrix_d = $4, scaling_factor = $5 WHERE stream_capture_id = $6'
      await db.query(
        query,
        [a, b, c, d, scaling_factor, streamCaptureId],
      )
    }

    return true
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertRegionOfInterest = (db: Database) => async (
  streamCaptureId: number,
  {
    polygons,
    name,
  }: {
    polygons: RoiPolygon[],
    name: string,
  },
) => {
  try {
    const query = 'INSERT INTO stream_roi (stream_capture_id, polygons, name) VALUES ($1, $2, $3)'

    await db.query(query, [streamCaptureId, polygons, name])
    return true
  } catch (e) {
    console.error(e)
    return null
  }
}

const retrieveRegionOfInterest = (db: Database) => async (
  streamCaptureId: number,
) => {
  try {
    const query = 'SELECT * FROM stream_roi WHERE stream_capture_id = $1'

    const res = await db.query(query, [streamCaptureId])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertLineOfInterest = (db: Database) => async (
  streamCaptureId: number,
  {
    polygons,
    name,
  }: {
    polygons: LoiPolygon[],
    name: string,
  },
) => {
  try {
    const query = 'INSERT INTO stream_loi (stream_capture_id, polygons, name) VALUES ($1, $2, $3)'

    await db.query(query, [streamCaptureId, polygons, name])
    return true
  } catch (e) {
    console.error(e)
    return null
  }
}

const retrieveLineOfInterest = (db: Database) => async (
  streamCaptureId: number,
) => {
  try {
    const query = 'SELECT * FROM stream_loi WHERE stream_capture_id = $1'

    const res = await db.query(query, [streamCaptureId])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

export type StreamCaptureStoreType = {
  retrieveRegionOfInterest: ReturnType<typeof retrieveRegionOfInterest>,
  insertRegionOfInterest: ReturnType<typeof insertRegionOfInterest>,
  retrieveLineOfInterest: ReturnType<typeof retrieveLineOfInterest>,
  insertLineOfInterest: ReturnType<typeof insertLineOfInterest>,
  insertCalibration: ReturnType<typeof insertCalibration>,
  getStreamCaptureByUrl: ReturnType<typeof getStreamCaptureByUrl>,
  updateCapturePath: ReturnType<typeof updateCapturePath>,
  insertStreamCapture: ReturnType<typeof insertStreamCapture>,
  getStreamCaptureById: ReturnType<typeof getStreamCaptureById>,
}

const StreamCaptureStore = ({ db }: { db: Database }): StreamCaptureStoreType => ({
  retrieveRegionOfInterest: retrieveRegionOfInterest(db),
  insertRegionOfInterest: insertRegionOfInterest(db),
  retrieveLineOfInterest: retrieveLineOfInterest(db),
  insertLineOfInterest: insertLineOfInterest(db),
  insertCalibration: insertCalibration(db),
  getStreamCaptureByUrl: getStreamCaptureByUrl(db),
  updateCapturePath: updateCapturePath(db),
  insertStreamCapture: insertStreamCapture(db),
  getStreamCaptureById: getStreamCaptureById(db),
})

export default StreamCaptureStore
