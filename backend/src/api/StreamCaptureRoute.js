const Router = require('express-promise-router')
const StreamCaptureStore = require('../data/StreamCaptureStore')
const { checkToken } = require('./AuthMiddleware')


const captureStream = (frameService, streamCaptureStore) => async (req, res) => {
  try {
    const framePath = await frameService.captureFrameFromStream(req.body.url)

    const possibleStreamCapture = await streamCaptureStore.getStreamCaptureByUrl(req.body.url)

    if (possibleStreamCapture) {
      const streamCapture = await streamCaptureStore.updateCapturePath(possibleStreamCapture.id, framePath)

      res.send(streamCapture).end()
    } else {
      const streamCapture = await streamCaptureStore.insertStreamCapture(req.body.url, framePath)
      res.send(streamCapture).end()
    }

  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getStreamCaptureByUrl = (streamCaptureStore) => async (req, res) => {
  try {
    const streamCapture = await streamCaptureStore.getStreamCaptureByUrl(req.body.url)

    if (streamCapture === null) {
      return res.send(404).end()
    }

    res.send(streamCapture).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const insertCalibration = (streamCaptureStore) => async (req, res) => {
  try {
    const success = await streamCaptureStore.insertCalibration(req.params.id, req.body)

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

const insertRegionOfInterest = (streamCaptureStore) => async (req, res) => {
  try {
    const success = await streamCaptureStore.insertRegionOfInterest(req.params.id, req.body)

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

const retrieveRegionOfInterest = (streamCaptureStore) => async (req, res) => {
  try {
    const result = await streamCaptureStore.retrieveRegionOfInterest(req.params.id)

    if (result === null) {
      return res.send(404).end()
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const insertLineOfInterest = (streamCaptureStore) => async (req, res) => {
  try {
    const success = await streamCaptureStore.insertLineOfInterest(req.params.id, req.body)

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

const retrieveLineOfInterest = (streamCaptureStore) => async (req, res) => {
  try {
    const result = await streamCaptureStore.retrieveLineOfInterest(req.params.id)

    if (result === null) {
      return res.send(404).end()
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

module.exports = (deps) => {

  const router = new Router()
  const streamCaptureStore = StreamCaptureStore(deps)

  router.post(
    '/',
    checkToken(deps.authService, ['deployer']),
    captureStream(deps.frameService, streamCaptureStore)
  )
  router.post(
    '/url',
    checkToken(deps.authService, ['deployer']),
    getStreamCaptureByUrl(streamCaptureStore),
  )
  router.post(
    '/:id/calibration',
    checkToken(deps.authService, ['deployer']),
    insertCalibration(streamCaptureStore)
  )
  router.post(
    '/:id/roi',
    checkToken(deps.authService, ['deployer']),
    insertRegionOfInterest(streamCaptureStore)
  )
  router.get(
    '/:id/roi',
    checkToken(deps.authService, ['deployer']),
    retrieveRegionOfInterest(streamCaptureStore)
  )

  router.post(
    '/:id/loi',
    checkToken(deps.authService),
    insertLineOfInterest(streamCaptureStore)
  )
  router.get(
    '/:id/loi',
    checkToken(deps.authService),
    retrieveLineOfInterest(streamCaptureStore)
  )

  return router
}

