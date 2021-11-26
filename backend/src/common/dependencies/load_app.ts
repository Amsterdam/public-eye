import express from 'express'
import bodyParser from 'body-parser'
import { createServer } from 'http'
import { Server } from 'socket.io'
import loadDependencies from 'common/dependencies'
import config from 'common/config'

const app = express()
app.use(bodyParser.json())
const httpServer = createServer(app)
const io = new Server(httpServer)

export default () => {
  const dependencies = loadDependencies(io, config)

  return { dependencies, app, httpServer, io }
}
