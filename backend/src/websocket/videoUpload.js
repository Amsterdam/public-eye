const fs = require('fs')
const VideoFileStore = require('../data/VideoFileStore')

const cleanUp = (socket, id) => {
  socket.removeAllListeners(`${id}-abort`)
  socket.removeAllListeners(`${id}-chunk`)
}

module.exports = (socket, basePath, db) => {
  socket.on('start-upload-video', (data, callback) => {
    try {        
      const videoFileStore = VideoFileStore({ db })

      const { id, name } = data
      const filename = `${basePath}/files/videos/${name}`

      if (fs.existsSync(filename)) {
        callback("file-exists")
        return
      }

      const writeStream = fs.createWriteStream(filename)
      let streamFinished = false
      callback("open")

      writeStream.on('error', () => {
        cleanUp(socket, id)
      })

      writeStream.on('finish', () => {
        streamFinished = true
        cleanUp(socket, id)
        videoFileStore.insertVideoFile(filename)
          .then((id) => videoFileStore.getVideoFileById(id))
          .then((videoFile) => {
            socket.emit(`${String(id)}-done`, videoFile)
          })
      })

      socket.on(`${id}-abort`, (callback) => {
        writeStream.destroy()
        fs.unlink(filename, () => {
          callback(true)
        })
        cleanUp(socket, id)
      })

      socket.on(`${id}-chunk`, ({ value, done }, callback) => {
        if (value) {
          writeStream.write(value, () => {
            callback(value.byteLength)
          })
        }

        if (done) {
          writeStream.end()
        }
      })

      socket.on("disconnect", () => {
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
  })
}
