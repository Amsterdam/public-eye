import SocketIO from 'socket.io'
import fs from 'fs'
import VideoFileStore from 'data/VideoFileStore'
import { Database } from 'db'

const cleanUp = (socket: SocketIO.Socket, id: number) => {
  socket.removeAllListeners(`${id}-abort`)
  socket.removeAllListeners(`${id}-chunk`)
}

type SocketCallback = (input: boolean | string | number) => void

const videoUpload = (
  socket: SocketIO.Socket,
  basePath: string,
  db: Database,
): void => {
  socket.on(
    'start-upload-video',
    (
      data: { id: number, name: string },
      callback: (input: string | boolean) => void,
    ) => {
      try {
        const videoFileStore = VideoFileStore({ db })

        const { id, name } = data
        const filename = `${basePath}/files/videos/${name}`

        if (fs.existsSync(filename)) {
          callback('file-exists')
          return
        }

        const writeStream = fs.createWriteStream(filename)
        let streamFinished = false
        callback('open')

        writeStream.on('error', () => {
          cleanUp(socket, id)
        })

        writeStream.on('finish', () => {
          streamFinished = true
          cleanUp(socket, id)
          videoFileStore.insertVideoFile(filename)
            .then((videoId: number | null) => videoFileStore.getVideoFileById(videoId as number))
            .then((videoFile) => {
              socket.emit(`${String(id)}-done`, videoFile)
            })
        })

        socket.on(`${id}-abort`, (socketCallback: SocketCallback) => {
          writeStream.destroy()
          fs.unlink(filename, () => {
            socketCallback(true)
          })
          cleanUp(socket, id)
        })

        socket.on(
          `${id}-chunk`,
          ({
            value,
            done,
          }: {
            value: ArrayBuffer,
            done: boolean,
          }, socketCallback: SocketCallback) => {
            if (value) {
              writeStream.write(value, () => {
                socketCallback(value.byteLength)
              })
            }

            if (done) {
              writeStream.end()
            }
          },
        )

        socket.on('disconnect', () => {
          if (!streamFinished) {
            writeStream.destroy()
            fs.unlink(filename, () => {
              callback(true)
            })
          }
        })
      } catch (e) {
        console.error(e)
      }
    },
  )
}

export default videoUpload
