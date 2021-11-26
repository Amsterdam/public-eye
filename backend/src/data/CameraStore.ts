import { Database } from 'db'
import {
  Camera,
  StreamCapture,
  RoiPolygon,
  LoiPolygon,
  StreamRoi,
  StreamLoi,
  StreamInstance,
  MultiCapture,
  VideoFile,
} from 'typescript-types'

const getAllCameras = (db: Database) => async () => {
  try {
    const query = 'SELECT * FROM camera'
    const res = await db.query(query)

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const updateCamera = (db: Database) => async (
  id: string,
  {
    name,
    stream_url,
    azimuth,
    supplier,
    geo_long,
    geo_lat,
    fps,
    area_size_m2,
  }: {
    name: string,
    stream_url: string,
    azimuth: string,
    supplier: string,
    geo_long: string,
    geo_lat: string,
    fps: string,
    area_size_m2?: string,
  },
): Promise<Camera | null> => {
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
    return res ? res.rows[0] as Camera : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getStreamCapture = (db: Database) => async (
  cameraId: string,
): Promise<StreamCapture | null> => {
  try {
    const query = 'SELECT * FROM stream_capture WHERE camera_id = $1'

    const res = await db.query(query, [cameraId])
    return res ? res.rows[0] as StreamCapture : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertCamera = (db: Database) => async ({
  name,
  stream_url,
  azimuth,
  supplier,
  geo_long,
  geo_lat,
  fps,
  area_size_m2,
}: {
  name: string,
  stream_url: string,
  azimuth: string,
  supplier: string,
  geo_long: string,
  geo_lat: string,
  fps: string,
  area_size_m2: string,
}): Promise<Camera | null> => {
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
      ],
    )
    return res ? res.rows[0] as Camera : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getCameraById = (db: Database) => async (
  id: number,
): Promise<Camera | null> => {
  try {
    const query = 'SELECT * FROM camera WHERE id = $1'

    const res = await db.query(query, [id])
    return res ? res.rows[0] as Camera : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getStreamCaptureByCameraId = (db: Database) => async (
  id: number,
): Promise<StreamCapture | null> => {
  try {
    const query = 'SELECT * FROM stream_capture WHERE camera_id = $1'

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

const insertStreamCapture = (db: Database) => async (
  cameraId: number,
  capturePath: string,
): Promise<StreamCapture | null> => {
  try {
    const query = 'INSERT INTO stream_capture (camera_id, capture_path) VALUES ($1, $2) RETURNING *'

    const res = await db.query(query, [cameraId, capturePath])
    return res ? res.rows[0] as StreamCapture : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertRegionOfInterest = (db: Database) => async (
  cameraId: number,
  {
    polygons,
    name,
  }: {
    polygons: RoiPolygon[],
    name: string,
  },
) => {
  try {
    const query = 'INSERT INTO stream_roi (camera_id, polygons, name) VALUES ($1, $2, $3) RETURNING *'

    const res = await db.query(query, [cameraId, polygons, name])
    return res ? res.rows[0] as StreamCapture : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const retrieveRegionOfInterest = (db: Database) => async (
  cameraId: number,
): Promise<StreamRoi[] | null> => {
  try {
    const query = 'SELECT * FROM stream_roi WHERE camera_id = $1'

    const res = await db.query<StreamRoi>(query, [cameraId])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const updateRegionOfInterest = (db: Database) => async (
  id: number,
  {
    polygons,
  }: {
    polygons: RoiPolygon,
  },
): Promise<StreamRoi | null> => {
  try {
    const query = 'UPDATE stream_roi SET polygons = $2 WHERE id = $1 RETURNING *'

    const res = await db.query(query, [id, polygons])
    return res ? res.rows[0] as StreamRoi : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getRegionOfInterestById = (db: Database) => async (
  id: string,
): Promise<StreamRoi | null> => {
  try {
    const query = 'SELECT * FROM stream_roi WHERE id = $1'
    const res = await db.query(query, [id])

    return res ? res.rows[0] as StreamRoi : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteRegionOfInterest = (db: Database) => async (
  id: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM stream_roi WHERE id = $1'
    await db.query(query, [id])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteCamera = (db: Database) => async (
  id: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM camera WHERE id = $1'
    await db.query(query, [id])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const insertCalibration = (db: Database) => async (
  cameraId: number,
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
): Promise<boolean> => {
  try {
    const calibrationExists = await db.query('SELECT * FROM calibration WHERE camera_id = $1', [cameraId])

    if (calibrationExists && calibrationExists.rows.length === 0) {
      const query = 'INSERT INTO calibration (camera_id, matrix_a, matrix_b, matrix_c, matrix_d, scaling_factor) VALUES ($1, $2, $3, $4, $5, $6)'
      await db.query(query, [cameraId, a, b, c, d, scaling_factor])
    } else {
      const query = 'UPDATE calibration SET matrix_a = $1, matrix_b = $2, matrix_c = $3, matrix_d = $4, scaling_factor = $5 WHERE camera_id = $6'
      await db.query(query, [a, b, c, d, scaling_factor, cameraId])
    }

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteStreamCaptureById = (db: Database) => async (
  id: number,
): Promise<void> => {
  try {
    const query = 'DELETE FROM stream_capture WHERE id = $1'

    await db.query(query, [id])
  } catch (e) {
    console.error(e)

    throw e
  }
}

const getStreamInstancesByCameraId = (db: Database) => async (
  id: number,
): Promise<StreamInstance[]> => {
  try {
    const query = 'SELECT * FROM stream_instance WHERE camera_id = $1'

    const res = await db.query(query, [id])
    return res ? res.rows as StreamInstance[] : []
  } catch (e) {
    console.error(e)

    throw e
  }
}

const getMultiCaptureStreamsByCameraId = (db: Database) => async (
  id: number,
): Promise<MultiCapture[]> => {
  try {
    const query = `
      SELECT multicapture_stream.* FROM multicapture_stream
      JOIN cameras_used_in_multicapture_stream ON cameras_used_in_multicapture_stream.multicapture_stream_id = multicapture_stream.id
      WHERE cameras_used_in_multicapture_stream.camera_id = $1`

    const res = await db.query(query, [id])
    return res ? res.rows as MultiCapture[] : []
  } catch (e) {
    console.error(e)

    throw e
  }
}

const deleteRoisByCameraId = (db: Database) => async (
  cameraId: number,
): Promise<void> => {
  try {
    const query = 'DELETE FROM stream_roi WHERE camera_id = $1'

    await db.query(query, [cameraId])
  } catch (e) {
    console.error(e)

    throw e
  }
}

const deleteCalibrationByCameraId = (db: Database) => async (
  cameraId: number,
): Promise<void> => {
  try {
    const query = 'DELETE FROM calibration WHERE camera_id = $1'

    await db.query(query, [cameraId])
  } catch (e) {
    console.error(e)

    throw e
  }
}

const insertLineOfInterest = (db: Database) => async (
  cameraId: number,
  {
    polygons,
    name,
  }: {
    polygons: LoiPolygon,
    name: string,
  },
): Promise<StreamLoi | null> => {
  try {
    const query = 'INSERT INTO stream_loi (camera_id, polygons, name) VALUES ($1, $2, $3) RETURNING *'

    const res = await db.query(query, [cameraId, polygons, name])
    return res ? res.rows[0] as StreamLoi : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const retrieveLinesOfInterest = (db: Database) => async (
  cameraId: number,
): Promise<StreamLoi[] | null> => {
  try {
    const query = 'SELECT * FROM stream_loi WHERE camera_id = $1'

    const res = await db.query<StreamLoi>(query, [cameraId])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteLineOfInterest = (db: Database) => async (
  id: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM stream_loi WHERE id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteLoisByCameraId = (db: Database) => async (
  cameraId: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM stream_loi WHERE camera_id = $1'

    await db.query(query, [cameraId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getVideosByCameraId = (db: Database) => async (
  cameraId: number,
): Promise<VideoFile[] | null> => {
  try {
    const query = `
      SELECT video_files.* FROM video_files
      JOIN video_captured_by_camera ON video_files.id = video_captured_by_camera.video_file_id
      WHERE camera_id = $1
    `

    const res = await db.query<VideoFile>(query, [cameraId])

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

export type CameraStoreType = {
  getVideosByCameraId: ReturnType<typeof getVideosByCameraId>,
  getMultiCaptureStreamsByCameraId: ReturnType<typeof getMultiCaptureStreamsByCameraId>,
  deleteLoisByCameraId: ReturnType<typeof deleteLoisByCameraId>,
  deleteLineOfInterest: ReturnType<typeof deleteLineOfInterest>,
  retrieveLinesOfInterest: ReturnType<typeof retrieveLinesOfInterest>,
  insertLineOfInterest: ReturnType<typeof insertLineOfInterest>,
  deleteCalibrationByCameraId: ReturnType<typeof deleteCalibrationByCameraId>,
  deleteRoisByCameraId: ReturnType<typeof deleteRoisByCameraId>,
  getStreamInstancesByCameraId: ReturnType<typeof getStreamInstancesByCameraId>,
  deleteStreamCaptureById: ReturnType<typeof deleteStreamCaptureById>,
  insertCalibration: ReturnType<typeof insertCalibration>,
  deleteCamera: ReturnType<typeof deleteCamera>,
  deleteRegionOfInterest: ReturnType<typeof deleteRegionOfInterest>,
  getRegionOfInterestById: ReturnType<typeof getRegionOfInterestById>,
  updateRegionOfInterest: ReturnType<typeof updateRegionOfInterest>,
  retrieveRegionOfInterest: ReturnType<typeof retrieveRegionOfInterest>,
  insertRegionOfInterest: ReturnType<typeof insertRegionOfInterest>,
  insertStreamCapture: ReturnType<typeof insertStreamCapture>,
  updateCapturePath: ReturnType<typeof updateCapturePath>,
  getStreamCaptureByCameraId: ReturnType<typeof getStreamCaptureByCameraId>,
  getCameraById: ReturnType<typeof getCameraById>,
  insertCamera: ReturnType<typeof insertCamera>,
  getStreamCapture: ReturnType<typeof getStreamCapture>,
  updateCamera: ReturnType<typeof updateCamera>,
  getAllCameras: ReturnType<typeof getAllCameras>,
}

const CameraStore = ({ db }: { db: Database }): CameraStoreType => ({
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

export default CameraStore
