import R from 'ramda'
import Router from 'express-promise-router'
import send from 'send'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import VideoFileStore, { VideoFileStoreType } from 'data/VideoFileStore'
import FrameStore, { FrameStoreType } from 'data/FrameStore'
import GroundTruthStore, { GroundTruthStoreType } from 'data/GroundTruthStore'
import TrainConfigStore, { TrainConfigStoreType } from 'data/TrainConfigStore'
import TrainingRunStore, { TrainingRunStoreType } from 'data/TrainingRunStore/index'
import StreamCaptureStore, { StreamCaptureStoreType } from 'data/StreamCaptureStore'
import { StaticFileServiceType } from 'services/StaticFileService'
import { FrameServiceType } from 'services/FrameService'
import { Dependencies } from 'common/dependencies'
import { checkToken } from '../AuthMiddleware'

const fetchVideoFile = (
  videoFileStore: VideoFileStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const videoEntity = await videoFileStore.getVideoFileById(
      Number(req.params.fileId),
    )
    if (videoEntity == null) {
      res.sendStatus(404).end()
      return
    }

    const stream = send(req, videoEntity.path)
    stream.on('error', (err) => new Error(err))
    stream.pipe(res)
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const fetchAllVideos = (
  videoFileStore: VideoFileStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const videos = await videoFileStore.getAllVideos(
    Number(req.query.skip),
    Number(req.query.limit),
    req.query.filter && String(req.query.filter),
  )
  const videoCount = await videoFileStore.getTotalVideoCount(
    req.query.filter && String(req.query.filter),
  )

  if (videos === null || videoCount === null) {
    res.sendStatus(404).end()
    return
  }

  res.send({ items: videos, count: videoCount }).end()
}

const fetchFrameFile = (
  staticFileService: StaticFileServiceType,
  frameStore: FrameStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const frameEntity = await frameStore.getFrameById(
    Number(req.params.fileId),
  )

  if (frameEntity == null) {
    res.sendStatus(404).end()
    return
  }

  try {
    const stream = await staticFileService.serveFileFromPath(frameEntity.path)
    stream.pipe(res)
  } catch (e) {
    console.error(e)
    res.sendStatus(404).end()
  }
}

const insertFrame = (
  frameService: FrameServiceType,
  videoFileStore: VideoFileStoreType,
  frameStore: FrameStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const video = await videoFileStore.getVideoFileById(
      Number(req.params.videoFileId),
    )

    if (video === null) {
      res.sendStatus(404).end()
      return
    }
    const { timestamp } = req.body as { timestamp: number }
    const framePath = await frameService.insertFrame(
      video.path,
      String(timestamp),
    )
    const frame = await frameStore.insertFrame(
      framePath,
      Number(req.params.videoFileId),
      timestamp,
    )
    res.send(frame).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const fetchFramesForVideoId = (frameStore: FrameStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const frames = await frameStore.getFrameByVideoFileId(
      Number(req.params.videoFileId),
      Number(req.query.skip),
      Number(req.query.limit),
    )

    if (frames === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(frames).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const fetchGroundTruthFile = (
  staticFileService: StaticFileServiceType,
  groundTruthStore: GroundTruthStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const groundTruthEntity = await groundTruthStore.getGroundTruthById(req.params.id)

    if (groundTruthEntity == null) {
      res.sendStatus(404).end()
      return
    }

    const stream = await staticFileService.serveFileFromPath(groundTruthEntity.render_path)
    stream.pipe(res)
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const fetchTrainConfigFile = (
  staticFileService: StaticFileServiceType,
  configStore: TrainConfigStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const configEntity = await configStore.getTrainConfigById(req.params.configId)

    if (configEntity == null) {
      res.sendStatus(404).end()
      return
    }

    const config = await staticFileService.serveJson(configEntity.path)

    res.send(config).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const fetchTrainingLogFile = (
  staticFileService: StaticFileServiceType,
  trainingRunStore: TrainingRunStoreType,
) => async (req: Request, res: Response): Promise<void> => {
  try {
    const trainingRunEntity = await trainingRunStore.getTrainingRunById(
      Number(req.params.runId),
    )

    if (trainingRunEntity == null) {
      res.sendStatus(404).end()
      return
    }

    if (trainingRunEntity.log_file_path) {
      const stream = await staticFileService.serveFileFromPath(trainingRunEntity.log_file_path)
      stream.pipe(res)
    } else {
      res.sendStatus(404).end()
    }
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const uploadFile = (videoFileStore: VideoFileStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (req.file && req.file.path) {
      await videoFileStore.insertVideoFile(req.file.path)
      res.sendStatus(201).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const deleteVideo = (
  videoFileStore: VideoFileStoreType,
  frameStore: FrameStoreType,
  staticFileService: StaticFileServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const frames = await frameStore.getFrameByVideoFileId(
      Number(req.params.videoFileId),
    )

    if (!frames) {
      res.send(404).end()
      return
    }

    if (frames.length > 0) {
      res.sendStatus(409).send('Video cannot be deleted if it still has frames.')
      return
    }
    const video = await videoFileStore.getVideoFileById(
      Number(req.params.videoFileId),
    )

    await videoFileStore.deleteVideoFileById(
      Number(req.params.videoFileId),
    )

    try {
      if (video) {
        await staticFileService.deleteFile(video.path)
      }
    } catch (e) {
      console.error(e)
    }

    res.sendStatus(204)
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

type UpdateVideoRequestBody = {
  fileName: string,
}

const updateVideo = (
  videoFileStore: VideoFileStoreType,
  staticFileService: StaticFileServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const video = await videoFileStore.getVideoFileById(
      Number(req.params.videoFileId),
    )
    if (!video) {
      res.send(404).end()
      return
    }

    const newPath = R.pipe(
      R.split('/'),
      // replace filename with file from request
      R.update(-1, (req.body as UpdateVideoRequestBody).fileName),
      R.join('/'),
    )(video.path)

    await staticFileService.renameFile(video.path, newPath)
    const updatedVideo = await videoFileStore.updateVideoFile(
      Number(req.params.videoFileId),
      newPath,
    )

    res.send(updatedVideo).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const serveStreamInstance = (
  staticFileService: StaticFileServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const relativePath = req.params.path
    const stream = await staticFileService.serveStreamInstance(req, relativePath) // send(req, path)

    stream.pipe(res)
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const fetchStreamCaptureFile = (
  staticFileService: StaticFileServiceType,
  streamCaptureStore: StreamCaptureStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const streamInstance = await streamCaptureStore.getStreamCaptureById(
      Number(req.params.id),
    )
    if (!streamInstance) {
      res.send(404).end()
      return
    }

    const stream = await staticFileService.serveFileFromPath(streamInstance.capture_path)
    stream.pipe(res)
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getVideoDataObject = (
  videoFileStore: VideoFileStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const video = await videoFileStore.getVideoFileById(
      Number(req.params.fileId),
    )

    if (video === null) {
      res.sendStatus(404).end()
    }

    res.send(video)
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const videoExists = (
  staticFileService: StaticFileServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const exists = await staticFileService.fileExists(req.params.fileName)

    res.send(exists)
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const staticFilesRoute = (deps: Dependencies): RouterType => {
  const router = Router()

  const videoFileStore = VideoFileStore(deps)
  const frameStore = FrameStore(deps)
  const groundTruthStore = GroundTruthStore(deps)
  const trainConfigFileStore = TrainConfigStore(deps)
  const trainingRunStore = TrainingRunStore(deps)
  const streamCaptureStore = StreamCaptureStore(deps)

  router.get(
    '/train_config/:configId',
    checkToken(deps.authService, ['trainer']),
    fetchTrainConfigFile(deps.staticFileService, trainConfigFileStore),
  )
  router.get(
    '/video_file/:fileId',
    checkToken(deps.authService, ['tagger']),
    getVideoDataObject(videoFileStore),
  )
  router.get(
    '/videos/:fileId',
    checkToken(deps.authService, ['tagger']),
    fetchVideoFile(videoFileStore),
  )
  router.get(
    '/video_exists/:fileName',
    checkToken(deps.authService, ['tagger']),
    videoExists(deps.staticFileService),
  )
  router.get(
    '/videos',
    checkToken(deps.authService, ['tagger']),
    fetchAllVideos(videoFileStore),
  )
  router.delete(
    '/videos/:videoFileId',
    checkToken(deps.authService, ['tagger']),
    deleteVideo(videoFileStore, frameStore, deps.staticFileService),
  )
  router.put(
    '/videos/:videoFileId',
    checkToken(deps.authService, ['tagger']),
    updateVideo(videoFileStore, deps.staticFileService),
  )
  router.get(
    '/frames/:fileId',
    checkToken(deps.authService, ['tagger', 'trainer']),
    fetchFrameFile(deps.staticFileService, frameStore),
  )
  router.get(
    '/ground_truth/:id',
    checkToken(deps.authService, ['tagger', 'trainer']),
    fetchGroundTruthFile(deps.staticFileService, groundTruthStore),
  )
  router.post(
    '/videos/:videoFileId/frames',
    checkToken(deps.authService, ['tagger']),
    insertFrame(
      deps.frameService,
      videoFileStore,
      frameStore,
    ),
  )
  router.get(
    '/videos/:videoFileId/frames',
    checkToken(deps.authService, ['tagger']),
    fetchFramesForVideoId(frameStore),
  )
  router.get(
    '/training_logs/:runId',
    checkToken(deps.authService, ['trainer']),
    fetchTrainingLogFile(deps.staticFileService, trainingRunStore),
  )
  router.post(
    '/videos/upload',
    checkToken(deps.authService, ['tagger']),
    deps.staticFileService.uploadMiddleware('/files/videos'),
    uploadFile(videoFileStore),
  )
  router.get(
    '/streams/:path',
    checkToken(deps.authService, ['deployer']),
    serveStreamInstance(deps.staticFileService),
  )
  router.get('/stream_capture/:id',
    checkToken(deps.authService, ['deployer']),
    fetchStreamCaptureFile(deps.staticFileService, streamCaptureStore))

  return router
}

export default staticFilesRoute
