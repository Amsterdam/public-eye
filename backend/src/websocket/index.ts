import { Server } from 'socket.io'
import { Config } from 'common/config'
import { Database } from 'db'
import videoUpload from './videoUpload'

const websocket = (
  io: Server,
  {
    basePath,
  }: Config,
  db: Database,
): void => {
  io.on('connection', (socket) => {
    videoUpload(socket, basePath, db)
  })
}

export default websocket
