const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const { uuid } = require('uuidv4')

const insertFrame = (config) => (videoPath, timestamp) => new Promise((resolve, reject) => {
  const framePath = `${config.basePath}/files/frames/img_${uuid()}.jpg`

  ffmpeg(videoPath)
    .inputOptions([
      '-ss', timestamp
    ])
    .outputOptions([
      '-vframes', 1,
    ])
    .output(framePath)
    .on('error', (err) => {
      reject(err)
    })
    .on('end', () => {
      // if it fails doesn't always throw error
      if (fs.existsSync(framePath)) {
        resolve(framePath)
      } else {
        reject(new Error('frame not created'))
      }
    })
    .run()
})

const captureFrameFromStream = (config) => (streamUrl) => new Promise((resolve, reject) => {
  const framePath = `${config.basePath}/files/stream_capture/img_${uuid()}.jpg`

   ffmpeg(streamUrl)
    .inputOption([
      '-y',
      '-stimeout',
      // timeout for connection in microseconds
      '5000000',
      '-rtsp_transport',
      'tcp',
    ])
    .outputOptions([
      '-frames:v 1',
    ])
    .saveToFile(framePath)
    .on('error', (err) => reject(err))
    .on('end', () => resolve(framePath))
})

const FrameService = (config) => {
  return {
    insertFrame: insertFrame(config),
    captureFrameFromStream: captureFrameFromStream(config),
  }
}

module.exports = FrameService
