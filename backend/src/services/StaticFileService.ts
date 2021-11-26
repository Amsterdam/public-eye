import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import multer from 'multer'
import send from 'send'
import { Request } from 'express'
import { Config } from 'common/config'

const serveFileFromPath = () => (
  path: string,
): Promise<fs.ReadStream> => (
  new Promise((res, rej) => {
    const stream = fs.createReadStream(path)

    stream.on('open', () => res(stream))
    stream.on('error', (err) => rej(err))
  })
)

const serveFileFromEnd = () => (
  path: string,
  {
    maxSize,
    offset,
  }: {
    maxSize: number,
    offset: number,
  },
): Promise<{ content: string, size: number }> => (
  new Promise((res, rej) => {
    try {
      const { size } = fs.statSync(path)
      const castedMaxSize = Number(maxSize)
      const castedOffset = Number(offset)

      fs.open(path, 'r', 0o666, (err: NodeJS.ErrnoException | null, fd: number) => {
        if (err) {
          rej(err)
          return
        }

        const offsetFromMaxSize = castedMaxSize ? size - Math.min(size, castedMaxSize) : 0
        const start = castedOffset || offsetFromMaxSize
        const end = Math.min(size, start + castedMaxSize)

        // no new data to fetch
        if (end <= start) {
          res({ content: '', size })
          return
        }

        const bufferSize = end - start
        const buffer = Buffer.alloc(bufferSize)

        fs.read(fd, buffer, 0, buffer.length, start, (readErr, bytesRead, content) => {
          if (err) {
            rej(readErr)
            return
          }

          res({ content: content.toString(), size: end })
        })
      })
    } catch (e) {
      console.error(e)
      rej(new Error(e))
    }
  })
)

const uploadMiddleware = (config: Config) => (location: string) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.basePath + location)
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname)
    },
  })

  return multer({ storage }).single('file')
}

const serveVideoFromTimestamp = () => (
  path: string,
  timestamp: string,
) => (
  new Promise((res, rej) => {
    const command = ffmpeg(path)
      .inputOptions([
        '-ss', timestamp,
      ])

    command.on('start', () => res(command))
    command.on('error', (err) => rej(err))
  })
)

const serveJson = () => async (path: string) => (
  new Promise((res, rej) => {
    try {
      // eslint-disable-next-line
      const config: Record<string, any> = JSON.parse(String(fs.readFileSync(path)))
      res(config)
    } catch (e) {
      rej(new Error(e))
    }
  })
)

const deleteFile = () => async (path: string) => (
  new Promise((res, rej) => {
    fs.unlink(path, (err) => {
      if (err) rej(err)
      else res(true)
    })
  })
)

const renameFile = () => async (
  oldPath: string,
  newPath: string,
) => (
  new Promise((res, rej) => {
    fs.rename(oldPath, newPath, (err) => {
      if (err) rej(err)
      else res(true)
    })
  })
)

const serveStreamInstance = (config: Config) => async (
  req: Request,
  relativePath: string,
): Promise<send.SendStream> => (
  new Promise((res, rej) => {
    const path = `${config.basePath}/files/streams/${relativePath}`
    const stream = send(req, path)

    stream.on('error', (err) => rej(err))
    res(stream)
  })
)

const fileExists = (config: Config) => async (
  relativePath: string,
) => (
  new Promise((res) => {
    const path = `${config.basePath}/${relativePath}`

    res(fs.existsSync(path))
  })
)

export type StaticFileServiceType = {
  fileExists: ReturnType<typeof fileExists>,
  serveFileFromEnd: ReturnType<typeof serveFileFromEnd>,
  serveStreamInstance: ReturnType<typeof serveStreamInstance>,
  renameFile: ReturnType<typeof renameFile>,
  deleteFile: ReturnType<typeof deleteFile>,
  serveJson: ReturnType<typeof serveJson>,
  serveFileFromPath: ReturnType<typeof serveFileFromPath>,
  uploadMiddleware: ReturnType<typeof uploadMiddleware>,
  serveVideoFromTimestamp: ReturnType<typeof serveVideoFromTimestamp>,
}

const StaticFileService = (config: Config): StaticFileServiceType => ({
  fileExists: fileExists(config),
  serveFileFromEnd: serveFileFromEnd(),
  serveStreamInstance: serveStreamInstance(config),
  renameFile: renameFile(),
  deleteFile: deleteFile(),
  serveJson: serveJson(),
  serveFileFromPath: serveFileFromPath(),
  uploadMiddleware: uploadMiddleware(config),
  serveVideoFromTimestamp: serveVideoFromTimestamp(),
})

export default StaticFileService
