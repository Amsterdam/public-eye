import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import { uuid } from 'uuidv4'
import { Config } from 'common/config'

const insertFrame = (config: Config) => (
  videoPath: string,
  timestamp: string,
): Promise<string> => new Promise((resolve, reject) => {
  const framePath = `${config.basePath}/files/frames/img_${uuid()}.jpg`

  ffmpeg(videoPath)
    .inputOptions([
      '-ss', timestamp,
    ])
    .outputOptions([
      '-vframes', '1',
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

const captureFrameFromStream = (config: Config) => (
  streamUrl: string,
): Promise<string> => new Promise((resolve, reject) => {
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

export type FrameServiceType = {
  insertFrame: ReturnType<typeof insertFrame>,
  captureFrameFromStream: ReturnType<typeof captureFrameFromStream>,
}

const FrameService = (config: Config): FrameServiceType => ({
  insertFrame: insertFrame(config),
  captureFrameFromStream: captureFrameFromStream(config),
})

export default FrameService
