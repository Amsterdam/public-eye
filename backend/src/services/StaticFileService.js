const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const multer = require('multer')
const send = require('send')

const serveFileFromPath = (config) => (path) => {
  return new Promise((res, rej) => {
    const stream = fs.createReadStream(path)

    stream.on('open', () => res(stream))
    stream.on('error', (err) => rej(new Error(err)))
  })
}

const serveFileFromEnd = (config) => (path, { maxSize, offset, }) => {
  return new Promise(async (res, rej) => {
    try {
      const { size } = fs.statSync(path)
      const castedMaxSize = Number(maxSize)
      const castedOffset = Number(offset)

      fs.open(path, (err, fd) => {
        if (err) rej(new Error(err))
  
        const offsetFromMaxSize = castedMaxSize ? size - Math.min(size, castedMaxSize) : 0
        const start = castedOffset || offsetFromMaxSize  
        const end = Math.min(size, start + castedMaxSize)

        // no new data to fetch
        if (end <= start) {
          return res({ content: '', size, })
        }
  
        const bufferSize = end - start
        const buffer = Buffer.alloc(bufferSize)
  
        fs.read(fd, buffer, 0, buffer.length, start, (err, bytesRead, content) => {
          if (err) return rej(new Error(err))
          
          return res({ content: content.toString(), size: end})
        })
      })
    } catch (e) {
      console.error(e)
      return rej(new Error(e))
    }
  })
}

const uploadMiddleware = (config) => (location) => {
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, config.basePath + location)
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
   
  return multer({ storage: storage }).single('file')
}

const serveVideoFromTimestamp = (config) => (path, timestamp) => {
  return new Promise((res, rej) => {
    const command = ffmpeg(path)
      .inputOptions([
        '-ss', timestamp
      ])

    command.on('start', () => res(command))
    command.on('error', (err) => rej(err))
  })
}

const serveJson = () => async (path) => {
  return new Promise((res, rej) => {
    try {
      const config = JSON.parse(fs.readFileSync(path))
      res(config)
    } catch (e) {
      rej(new Error(e))
    }
  })
}

const deleteFile = () => async (path) => {
  return new Promise((res, rej) => {
    fs.unlink(path, (err) => {
      if (err) rej(err)
      else     res(true)
    })
  })
}

const renameFile = () => async (oldPath, newPath) => {
  return new Promise((res, rej) => {
    fs.rename(oldPath, newPath, (err) => {
      if (err) rej(err)
      else     res(true)
    })
  })
}

const serveStreamInstance = (config) => async (req, relativePath) => {
  return new Promise((res, rej) => {
    const path = config.basePath + '/files/streams/' + relativePath 
    const stream = send(req, path)

    stream.on('error', (err) => rej(err))
    res(stream)
  })
}

const fileExists = (config) => async (relativePath) => {
  return new Promise((res, rej) => {
    const path = `${config.basePath}/${relativePath}`

    res(fs.existsSync(path))
  })
}

const StaticFileService = (config) => {
  return {
    fileExists: fileExists(config),
    serveFileFromEnd: serveFileFromEnd(config),
    serveStreamInstance: serveStreamInstance(config),
    renameFile: renameFile(),
    deleteFile: deleteFile(),
    serveJson: serveJson(),
    serveFileFromPath: serveFileFromPath(config),
    uploadMiddleware: uploadMiddleware(config),
    serveVideoFromTimestamp: serveVideoFromTimestamp(config)
  }
}

module.exports = StaticFileService
