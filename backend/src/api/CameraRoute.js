const Router = require('express-promise-router')
const R = require('ramda')
const CameraStore = require('../data/CameraStore')
const { checkToken } = require('./AuthMiddleware')


const getAllCameras = (cameraStore) => async (req, res) => {
  try {
    const cameras = await cameraStore.getAllCameras()

    if (cameras) {
      res.send(cameras).end()
    } else {
      res.send(500).end()
    }
    return res.send
  } catch(e) {
    console.error(e)
    res.send(500).end()
  }
}

const updateCamera = (cameraStore) => async (req, res) => {
  try {
    const camera = await cameraStore.updateCamera(req.params.id, req.body)

    if (camera) {
      return res.send(camera).end()
    } else {
      res.send(500).end()
    }
  } catch(e) {
    console.error(e)
    res.send(500).end()
  }
}

const getStreamCapture = (cameraStore) => async (req, res) => {
  try {
    const streamCapture = await cameraStore.getStreamCapture(req.params.id)

    if (streamCapture) {
      res.send(streamCapture).end()
    } else {
      res.send(404).end()
    }
  } catch(e) {
    console.error(e)
    res.send(500).end()
  }
}

const insertCamera = (cameraStore) => async (req, res) => {
  try {
    const camera = await cameraStore.insertCamera(req.body)
    if (camera) {
      res.send(camera).end()
    } else {
      res.send(500).end()
    }
  } catch(e) {
    console.error(e)
    res.send(500).end()
  }
}

const captureStream = (frameService, cameraStore) => async (req, res) => {
  try {
    const camera = await cameraStore.getCameraById(req.params.id)
    const framePath = await frameService.captureFrameFromStream(camera.stream_url)

    const possibleStreamCapture = await cameraStore.getStreamCaptureByCameraId(req.params.id)

    if (possibleStreamCapture) {
      const streamCapture = await cameraStore.updateCapturePath(possibleStreamCapture.id, framePath)

      res.send(streamCapture).end()
    } else {
      const streamCapture = await cameraStore.insertStreamCapture(req.params.id, framePath)
      res.send(streamCapture).end()
    }

  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const insertRegionOfInterest = (cameraStore) => async (req, res) => {
  try {
    const roi = await cameraStore.insertRegionOfInterest(req.params.id, req.body)

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

const retrieveRegionOfInterest = (cameraStore) => async (req, res) => {
  try {
    const result = await cameraStore.retrieveRegionOfInterest(req.params.id)

    if (result === null) {
      return res.send(404).end()
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const updateRegionOfInterest = (cameraStore) => async (req, res) => {
  try {
    const success = await cameraStore.updateRegionOfInterest(req.params.roiId, req.body)
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

const deleteRegionOfInterest = (cameraStore) => async (req, res) => {
  try {
    const success = await cameraStore.deleteRegionOfInterest(req.params.roiId)

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

const deleteCamera = (cameraStore, staticFileService) => async (req, res) => {
  try {
    const streamInstances = await cameraStore.getStreamInstancesByCameraId(req.params.id)
    const multiCaptures = await cameraStore.getMultiCaptureStreamsByCameraId(req.params.id)
    if (
      (streamInstances && streamInstances.length > 0)
      || (multiCaptures && multiCaptures.length > 0)
    ) {
      return res.sendStatus(409).end()
    }

    await cameraStore.deleteLoisByCameraId(req.params.id)
    await cameraStore.deleteRoisByCameraId(req.params.id)
    await cameraStore.deleteCalibrationByCameraId(req.params.id)
    const streamCapture = await cameraStore.getStreamCaptureByCameraId(req.params.id)
    if (streamCapture) {
      await cameraStore.deleteStreamCaptureById(streamCapture.id)
      await staticFileService.deleteFile(streamCapture.capture_path)
    }
    
    const success = await cameraStore.deleteCamera(req.params.id)

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

const insertCalibration = (cameraStore) => async (req, res) => {
  try {
    const success = await cameraStore.insertCalibration(req.params.id, req.body)

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

const getStreamInstancesForCamera = (cameraStore) => async (req, res) => {
  try {
    const streamInstances = await cameraStore.getStreamInstancesByCameraId(req.params.cameraId)

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

const getMulltiCapturesForCamera = (cameraStore) => async (req, res) => {
  try {
    const multiCaptures = await cameraStore.getMultiCaptureStreamsByCameraId(req.params.cameraId)

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

const insertLineOfInterest = (cameraStore) => async (req, res) => {
  try {
    const loi = await cameraStore.insertLineOfInterest(req.params.id, req.body)

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

const retrieveLinesOfInterest = (cameraStore) => async (req, res) => {
  try {
    const lois = await cameraStore.retrieveLinesOfInterest(req.params.id)

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

const deleteLineOfInterest = (cameraStore) => async (req, res) => {
  try {
    const success = await cameraStore.deleteLineOfInterest(req.params.loiId)

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

const getVideosByCamera = (cameraStore) => async (req, res) => {
  try {
    const videos = await cameraStore.getVideosByCameraId(req.params.id)

    if (videos === null) {
      res.sendStatus(404).end()
    }

    res.send(videos).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

module.exports = (deps) => {
  const router = new Router()
  const cameraStore = CameraStore(deps)

  router.get(
    '/',
    checkToken(deps.authService, ['deployer']),
    getAllCameras(cameraStore)
  )
  router.post(
    '/',
    checkToken(deps.authService, ['deployer']),
    insertCamera(cameraStore)
  )
  router.put(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    updateCamera(cameraStore)
  )
  router.delete(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    deleteCamera(cameraStore, deps.staticFileService)
  )
  router.get(
    '/:id/stream_capture',
    checkToken(deps.authService, ['deployer']),
    getStreamCapture(cameraStore)
  )
  router.post(
    '/:id/stream_capture',
    checkToken(deps.authService, ['deployer']),
    captureStream(deps.frameService, cameraStore)
  )
  router.get(
    '/:id/videos',
    checkToken(deps.authService, ['deployer']),
    getVideosByCamera(cameraStore)
  )

  router.post(
    '/:id/calibration',
    checkToken(deps.authService, ['deployer']),
    insertCalibration(cameraStore)
  )
  router.post(
    '/:id/roi',
    checkToken(deps.authService, ['deployer']),
    insertRegionOfInterest(cameraStore)
  )
  router.get(
    '/:id/roi',
    checkToken(deps.authService, ['deployer']),
    retrieveRegionOfInterest(cameraStore)
  )
  router.put(
    '/:cameraId/roi/:roiId',
    checkToken(deps.authService, ['deployer']),
    updateRegionOfInterest(cameraStore)
  )
  router.delete(
    '/:cameraId/roi/:roiId',
    checkToken(deps.authService, ['deployer']),
    deleteRegionOfInterest(cameraStore)
  )

  router.get(
    '/:cameraId/stream_instance',
    checkToken(deps.authService, ['deployer']),
    getStreamInstancesForCamera(cameraStore)
  )
  router.get(
    '/:cameraId/multicapture_stream',
    checkToken(deps.authService, ['deployer']),
    getMulltiCapturesForCamera(cameraStore)
  )

  router.post(
    '/:id/loi',
    checkToken(deps.authService, ['deployer']),
    insertLineOfInterest(cameraStore)
  )
  router.get(
    '/:id/loi',
    checkToken(deps.authService, ['deployer']),
    retrieveLinesOfInterest(cameraStore)
  )
  router.delete(
    '/:id/loi/:loiId',
    checkToken(deps.authService, ['deployer']),
    deleteLineOfInterest(cameraStore)
  )
  return router
}