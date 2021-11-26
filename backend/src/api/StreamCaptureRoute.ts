import Router from 'express-promise-router'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import StreamCaptureStore, { StreamCaptureStoreType } from 'data/StreamCaptureStore'
import { FrameServiceType } from 'services/FrameService'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

type CaptureStreamRequestBody = {
  url: string,
}

const captureStream = (
  frameService: FrameServiceType,
  streamCaptureStore: StreamCaptureStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const framePath = await frameService.captureFrameFromStream(
      (req.body as CaptureStreamRequestBody).url,
    )

    const possibleStreamCapture = await streamCaptureStore.getStreamCaptureByUrl(
      (req.body as CaptureStreamRequestBody).url,
    )

    if (possibleStreamCapture) {
      const streamCapture = await streamCaptureStore.updateCapturePath(
        Number(possibleStreamCapture.id),
        framePath,
      )

      res.send(streamCapture).end()
    } else {
      const streamCapture = await streamCaptureStore.insertStreamCapture(
        (req.body as CaptureStreamRequestBody).url,
        framePath,
      )
      res.send(streamCapture).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

type GetStreamCaptureByUrl = {
  url: string,
}

const getStreamCaptureByUrl = (
  streamCaptureStore: StreamCaptureStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const streamCapture = await streamCaptureStore.getStreamCaptureByUrl(
      (req.body as GetStreamCaptureByUrl).url,
    )

    if (streamCapture === null) {
      res.send(404).end()
      return
    }

    res.send(streamCapture).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const insertCalibration = (
  streamCaptureStore: StreamCaptureStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const success = await streamCaptureStore.insertCalibration(
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

const insertRegionOfInterest = (
  streamCaptureStore: StreamCaptureStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const success = await streamCaptureStore.insertRegionOfInterest(
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

const retrieveRegionOfInterest = (
  streamCaptureStore: StreamCaptureStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await streamCaptureStore.retrieveRegionOfInterest(
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

const insertLineOfInterest = (
  streamCaptureStore: StreamCaptureStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const success = await streamCaptureStore.insertLineOfInterest(
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

const retrieveLineOfInterest = (
  streamCaptureStore: StreamCaptureStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await streamCaptureStore.retrieveLineOfInterest(
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

const StreamCaptureRoute = (deps: Dependencies): RouterType => {
  const router = Router()
  const streamCaptureStore = StreamCaptureStore(deps)

  router.post(
    '/',
    checkToken(deps.authService, ['deployer']),
    captureStream(deps.frameService, streamCaptureStore),
  )
  router.post(
    '/url',
    checkToken(deps.authService, ['deployer']),
    getStreamCaptureByUrl(streamCaptureStore),
  )
  router.post(
    '/:id/calibration',
    checkToken(deps.authService, ['deployer']),
    insertCalibration(streamCaptureStore),
  )
  router.post(
    '/:id/roi',
    checkToken(deps.authService, ['deployer']),
    insertRegionOfInterest(streamCaptureStore),
  )
  router.get(
    '/:id/roi',
    checkToken(deps.authService, ['deployer']),
    retrieveRegionOfInterest(streamCaptureStore),
  )

  router.post(
    '/:id/loi',
    checkToken(deps.authService),
    insertLineOfInterest(streamCaptureStore),
  )
  router.get(
    '/:id/loi',
    checkToken(deps.authService),
    retrieveLineOfInterest(streamCaptureStore),
  )

  return router
}

export default StreamCaptureRoute
