const R = require('ramda')

const Router = require('express-promise-router')
const send = require('send')
const { checkToken } = require('./AuthMiddleware')
const VideoFileStore = require('../data/VideoFileStore')
const FrameStore = require('../data/FrameStore')
const GroundTruthStore = require('../data/GroundTruthStore')
const TrainConfigStore = require('../data/TrainConfigStore')
const TrainingRunStore = require('../data/TrainingRunStore')
const StreamCaptureStore = require('../data/StreamCaptureStore')


const fetchVideoFile = ( videoFileStore) => async (req, res) => {
  try {
    const videoEntity = await videoFileStore.getVideoFileById(req.params.fileId)
    if (videoEntity == null) {
      return res.sendStatus(404).end()
    }

    const stream = send(req, videoEntity.path)
    stream.on('error', (err) => new Error(err))
    stream.pipe(res)

  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const fetchAllVideos = (videoFileStore) => async (req, res) => {
  const videos = await videoFileStore.getAllVideos(req.query.skip, req.query.limit, req.query.filter)
  const videoCount = await videoFileStore.getTotalVideoCount(req.query.filter)

  if (videos === null || videoCount === null) {
    return res.sendStatus(404).end()
  }

  res.send({ items: videos, count: videoCount }).end()
}

const fetchFrameFile = (staticFileService, frameStore) => async (req, res) => {
  const frameEntity = await frameStore.getFrameById(req.params.fileId)
  
  if (frameEntity == null) {
    return res.sendStatus(404).end()
  }

  try {
    const stream = await staticFileService.serveFileFromPath(frameEntity.path)
    stream.pipe(res)
  } catch (e) {
    console.error(e)
    return res.sendStatus(404).end()
  }
}

const insertFrame = (frameService, videoFileStore, frameStore) => async (req, res) => {
  try {
    const video = await videoFileStore.getVideoFileById(req.params.videoFileId)

    if (video === null) {
      res.sendStatus(404).end()
    }
    const { timestamp } = req.body
    const framePath = await frameService.insertFrame(video.path, timestamp)
    const frame = await frameStore.insertFrame(
      framePath, req.params.videoFileId, timestamp)
    return res.send(frame).end()
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const fetchFramesForVideoId = (frameStore) => async(req, res) => {
  try {
    const frames = await frameStore.getFrameByVideoFileId(req.params.videoFileId, req.query.skip, req.query.limit)

    if (frames === null) {
      return res.sendStatus(404).end()
    }
    return res.send(frames)
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const uploadVideo = (videoFileStore, staticFileService) => async(req, res) => {
  try {
    staticFileService.uploadFile()
    res.sendStatus(200)
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const fetchGroundTruthFile = (staticFileService, groundTruthStore) => async (req, res) => {
  try {
    const groundTruthEntity = await groundTruthStore.getGroundTruthById(req.params.id)
  
    if (groundTruthEntity == null) {
      return res.sendStatus(404).end()
    }
  
    const stream = await staticFileService.serveFileFromPath(groundTruthEntity.render_path)
    stream.pipe(res)

  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const fetchTrainConfigFile = (staticFileService, configStore) => async (req, res) => {
  try {
    const configEntity = await configStore.getTrainConfigById(req.params.configId)

    if (configEntity == null) {
      return res.sendStatus(404).end()
    }
  
    var config = await staticFileService.serveJson(configEntity.path)

    res.send(config).end()
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const fetchTrainingLogFile = (staticFileService, trainingRunStore) => async (req, res) => {
  try {
    const trainingRunEntity = await trainingRunStore.getTrainingRunById(req.params.runId)

    if (trainingRunEntity == null) {
      return res.sendStatus(404).end()
    }

    if (trainingRunEntity.log_file_path) {
      const stream = await staticFileService.serveFileFromPath(trainingRunEntity.log_file_path)
      stream.pipe(res)
    } else {
      res.sendStatus(404).end()
    }

  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const uploadFile = (videoFileStore) => async (req, res) => {
  try {
    if (req.file.path) {
      await videoFileStore.insertVideoFile(req.file.path)
      res.sendStatus(201).end()
    } else {
      return res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const deleteVideo = (videoFileStore, frameStore, staticFileService) => async (req, res) => {
  try {
    const frames = await frameStore.getFrameByVideoFileId(req.params.videoFileId)
    if (frames.length > 0) {
      res.sendStatus(409).send("Video cannot be deleted if it still has frames.")
      return
    }
    const video = await videoFileStore.getVideoFileById(req.params.videoFileId)

    await videoFileStore.deleteVideoFileById(req.params.videoFileId)

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
    return res.sendStatus(500).end()
  }
}

const updateVideo = (videoFileStore, staticFileService) => async (req, res) => {
  try {
    const video = await videoFileStore.getVideoFileById(req.params.videoFileId)
    const newPath = R.pipe(
      R.split('/'),
      // replace filename with file from request
      R.update(-1, req.body.fileName),
      R.join('/')
    )(video.path)
    
    await staticFileService.renameFile(video.path, newPath)
    const updatedVideo = await videoFileStore.updateVideoFile(req.params.videoFileId, newPath)

    res.send(updatedVideo).end()
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const serveStreamInstance = (staticFileService) => async (req, res) => {
  try {
    const relativePath = req.params.path
    const stream = await staticFileService.serveStreamInstance(req, relativePath)  // send(req, path)
    
    stream.pipe(res)
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const fetchStreamCaptureFile = (staticFileService, streamCaptureStore) => async (req, res) => {
  try {
    const streamInstance = await streamCaptureStore.getStreamCaptureById(req.params.id)

    const stream = await staticFileService.serveFileFromPath(streamInstance.capture_path)
    stream.pipe(res)
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const getVideoDataObject = (videoFileStore) => async (req, res) => {
  try {
    const video = await videoFileStore.getVideoFileById(req.params.fileId)

    if (video === null) {
      res.sendStatus(404).end()
    }

    res.send(video)
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const videoExists = (staticFileService) => async (req, res) => {
  try {
    const exists = await staticFileService.fileExists(req.params.fileName)

    res.send(exists)
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

module.exports = (deps) => {
  const router = new Router()

  const videoFileStore = VideoFileStore(deps)
  const frameStore = FrameStore(deps)
  const groundTruthStore = GroundTruthStore(deps)
  const trainConfigFileStore = TrainConfigStore(deps)
  const trainingRunStore = TrainingRunStore(deps)
  const streamCaptureStore = StreamCaptureStore(deps)

  router.get(
    '/train_config/:configId',
    checkToken(deps.authService, ['trainer']),
    fetchTrainConfigFile(deps.staticFileService, trainConfigFileStore)
  )
  router.get(
    '/video_file/:fileId',
    checkToken(deps.authService, ['tagger']),
    getVideoDataObject(videoFileStore)
  )
  router.get(
    '/videos/:fileId',
    checkToken(deps.authService, ['tagger']),
    fetchVideoFile(videoFileStore)
  )
  router.get(
    '/video_exists/:fileName',
    checkToken(deps.authService, ['tagger']),
    videoExists(videoFileStore)
  )
  router.get(
    '/videos',
    checkToken(deps.authService, ['tagger']),
    fetchAllVideos(videoFileStore)
  )
  router.post(
    '/videos',
    checkToken(deps.authService, ['tagger']),
    uploadVideo(videoFileStore, deps.staticFileService)
  )
  router.delete(
    '/videos/:videoFileId',
    checkToken(deps.authService, ['tagger']),
    deleteVideo(videoFileStore, frameStore, deps.staticFileService)
  )
  router.put(
    '/videos/:videoFileId',
    checkToken(deps.authService, ['tagger']),
    updateVideo(videoFileStore, deps.staticFileService)
  )
  router.get(
    '/frames/:fileId',
    checkToken(deps.authService, ['tagger', 'trainer']),
    fetchFrameFile(deps.staticFileService, frameStore)
  )
  router.get(
    '/ground_truth/:id',
    checkToken(deps.authService, ['tagger', 'trainer']),
    fetchGroundTruthFile(deps.staticFileService, groundTruthStore)
  )
  router.post(
    '/videos/:videoFileId/frames',
    checkToken(deps.authService, ['tagger']),
    insertFrame(
      deps.frameService,
      videoFileStore,
      frameStore,
    )
  )
  router.get(
    '/videos/:videoFileId/frames',
    checkToken(deps.authService, ['tagger']),
    fetchFramesForVideoId(frameStore)
  )
  router.get(
    '/training_logs/:runId',
    checkToken(deps.authService, ['trainer']),
    fetchTrainingLogFile(deps.staticFileService, trainingRunStore)
  )
  router.post(
    '/videos/upload',
    checkToken(deps.authService, ['tagger']),
    deps.staticFileService.uploadMiddleware("/files/videos"),
    uploadFile(videoFileStore)
  )
  router.get(
    '/streams/:path',
    checkToken(deps.authService, ['deployer']),
    serveStreamInstance(deps.staticFileService),
  )
  router.get('/stream_capture/:id',
    checkToken(deps.authService, ['deployer']),
    fetchStreamCaptureFile(deps.staticFileService, streamCaptureStore)
  )

  return router
}
