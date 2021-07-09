const videoUpload = require('./videoUpload')

module.exports = (io, { basePath }, db) => {
  io.on('connection', function (socket) {
    videoUpload(socket, basePath, db)
  })
}
