import Router from 'express-promise-router'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import CameraStore, { CameraStoreType } from 'data/CameraStore'
import { FrameServiceType } from 'services/FrameService'
import { StaticFileServiceType } from 'services/StaticFileService'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

const getAllCameras = (cameraStore: CameraStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const cameras = await cameraStore.getAllCameras()

    if (cameras) {
      res.send(cameras).end()
    } else {
      res.send(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}


const getCamera = (cameraStore: CameraStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const camera = await cameraStore.getCameraById(Number(req.params.id))

    if (camera) {
      res.send(camera).end()
    } else {
      res.send(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const updateCamera = (cameraStore: CameraStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const camera = await cameraStore.updateCamera(req.params.id, req.body)

    if (camera) {
      res.send(camera).end()
      return
    }
    res.send(500).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getStreamCapture = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const streamCapture = await cameraStore.getStreamCapture(req.params.id)

    if (streamCapture) {
      res.send(streamCapture).end()
    } else {
      res.send(404).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const insertCamera = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const camera = await cameraStore.insertCamera(req.body)
    if (camera) {
      res.send(camera).end()
    } else {
      res.send(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const captureStream = (
  frameService: FrameServiceType,
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const camera = await cameraStore.getCameraById(
      Number(req.params.id),
    )
    if (!camera) {
      res.send(404).end()
      return
    }

    const framePath = await frameService.captureFrameFromStream(
      camera.stream_url,
    )

    const possibleStreamCapture = await cameraStore.getStreamCaptureByCameraId(
      Number(req.params.id),
    )

    if (possibleStreamCapture) {
      const streamCapture = await cameraStore.updateCapturePath(possibleStreamCapture.id, framePath)

      res.send(streamCapture).end()
    } else {
      const streamCapture = await cameraStore.insertStreamCapture(
        Number(req.params.id),
        framePath,
      )
      res.send(streamCapture).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const insertRegionOfInterest = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const roi = await cameraStore.insertRegionOfInterest(
      Number(req.params.id),
      req.body,
    )

    if (roi) {
      res.send(roi).end()
    } else {
      res.send(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const retrieveRegionOfInterest = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await cameraStore.retrieveRegionOfInterest(
      Number(req.params.id),
    )

    if (result === null) {
      res.send(404).end()
      return
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const updateRegionOfInterest = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const success = await cameraStore.updateRegionOfInterest(
      Number(req.params.roiId),
      req.body,
    )
    const roi = await cameraStore.getRegionOfInterestById(req.params.roiId)
    if (success && roi) {
      res.send(roi).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const deleteRegionOfInterest = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const success = await cameraStore.deleteRegionOfInterest(
      Number(req.params.roiId),
    )

    if (success) {
      res.sendStatus(204).end()
    } else {
      res.send(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const deleteCamera = (
  cameraStore: CameraStoreType,
  staticFileService: StaticFileServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const streamInstances = await cameraStore.getStreamInstancesByCameraId(
      Number(req.params.id),
    )
    const multiCaptures = await cameraStore.getMultiCaptureStreamsByCameraId(
      Number(req.params.id),
    )

    if (
      (streamInstances && streamInstances.length > 0)
      || (multiCaptures && multiCaptures.length > 0)
    ) {
      res.sendStatus(409).end()
      return
    }

    await cameraStore.deleteLoisByCameraId(
      Number(req.params.id),
    )
    await cameraStore.deleteRoisByCameraId(
      Number(req.params.id),
    )
    await cameraStore.deleteCalibrationByCameraId(
      Number(req.params.id),
    )
    const streamCapture = await cameraStore.getStreamCaptureByCameraId(
      Number(req.params.id),
    )
    if (streamCapture) {
      await cameraStore.deleteStreamCaptureById(streamCapture.id)
      await staticFileService.deleteFile(streamCapture.capture_path)
    }

    const success = await cameraStore.deleteCamera(
      Number(req.params.id),
    )

    if (success) {
      res.sendStatus(204).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const insertCalibration = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const success = await cameraStore.insertCalibration(
      Number(req.params.id),
      req.body,
    )

    if (success) {
      res.send(200).end()
    } else {
      res.send(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getStreamInstancesForCamera = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const streamInstances = await cameraStore.getStreamInstancesByCameraId(
      Number(req.params.cameraId),
    )

    if (streamInstances) {
      res.send(streamInstances).end()
    } else {
      res.sendStatus(404).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getMulltiCapturesForCamera = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const multiCaptures = await cameraStore.getMultiCaptureStreamsByCameraId(
      Number(req.params.cameraId),
    )

    if (multiCaptures) {
      res.send(multiCaptures).end()
    } else {
      res.sendStatus(404).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const insertLineOfInterest = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const loi = await cameraStore.insertLineOfInterest(
      Number(req.params.id),
      req.body,
    )

    if (loi) {
      res.send(loi).end()
    } else {
      res.send(500).end()
    }
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const retrieveLinesOfInterest = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const lois = await cameraStore.retrieveLinesOfInterest(
      Number(req.params.id),
    )

    if (lois) {
      res.send(lois).end()
    } else {
      res.sendStatus(404).end()
    }
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const deleteLineOfInterest = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const success = await cameraStore.deleteLineOfInterest(
      Number(req.params.loiId),
    )

    if (success) {
      res.sendStatus(204).end()
    } else {
      res.send(500).end()
    }
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getVideosByCamera = (
  cameraStore: CameraStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const videos = await cameraStore.getVideosByCameraId(
      Number(req.params.id),
    )

    if (videos === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(videos).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const CameraRoute = (deps: Dependencies): RouterType => {
  const router = Router()
  const cameraStore = CameraStore(deps)

  router.get(
    '/',
    checkToken(deps.authService, ['deployer']),
    getAllCameras(cameraStore),
  )
  router.post(
    '/',
    checkToken(deps.authService, ['deployer']),
    insertCamera(cameraStore),
  )
  router.get(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    getCamera(cameraStore)
  )
  router.put(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    updateCamera(cameraStore),
  )
  router.delete(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    deleteCamera(cameraStore, deps.staticFileService),
  )
  router.get(
    '/:id/stream_capture',
    checkToken(deps.authService, ['deployer']),
    getStreamCapture(cameraStore),
  )
  router.post(
    '/:id/stream_capture',
    checkToken(deps.authService, ['deployer']),
    captureStream(deps.frameService, cameraStore),
  )
  router.get(
    '/:id/videos',
    checkToken(deps.authService, ['deployer']),
    getVideosByCamera(cameraStore),
  )

  router.post(
    '/:id/calibration',
    checkToken(deps.authService, ['deployer']),
    insertCalibration(cameraStore),
  )
  router.post(
    '/:id/roi',
    checkToken(deps.authService, ['deployer']),
    insertRegionOfInterest(cameraStore),
  )
  router.get(
    '/:id/roi',
    checkToken(deps.authService, ['deployer']),
    retrieveRegionOfInterest(cameraStore),
  )
  router.put(
    '/:cameraId/roi/:roiId',
    checkToken(deps.authService, ['deployer']),
    updateRegionOfInterest(cameraStore),
  )
  router.delete(
    '/:cameraId/roi/:roiId',
    checkToken(deps.authService, ['deployer']),
    deleteRegionOfInterest(cameraStore),
  )

  router.get(
    '/:cameraId/stream_instance',
    checkToken(deps.authService, ['deployer']),
    getStreamInstancesForCamera(cameraStore),
  )
  router.get(
    '/:cameraId/multicapture_stream',
    checkToken(deps.authService, ['deployer']),
    getMulltiCapturesForCamera(cameraStore),
  )

  router.post(
    '/:id/loi',
    checkToken(deps.authService, ['deployer']),
    insertLineOfInterest(cameraStore),
  )
  router.get(
    '/:id/loi',
    checkToken(deps.authService, ['deployer']),
    retrieveLinesOfInterest(cameraStore),
  )
  router.delete(
    '/:id/loi/:loiId',
    checkToken(deps.authService, ['deployer']),
    deleteLineOfInterest(cameraStore),
  )
  return router
}

export default CameraRoute
