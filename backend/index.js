const db = require('./src/db')
const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const bodyParser = require('body-parser')
const mountWebsocket = require('./src/websocket')
const mountApi = require('./src/api')
const config = require('./src/common/config')
const AuthService = require('./src/services/AuthService')
const StaticFileService = require('./src/services/StaticFileService')
const FrameService = require('./src/services/FrameService')
const SchedulerService = require('./src/services/SchedulerService')
const ModuleService = require('./src/services/ModuleService')

const init = async () => {
  console.log(config)
  await db.connect(config.postgres)

  // parse various different custom JSON types as JSON
  app.use(bodyParser.json()) // ({ type: 'application/*+json' }))

  const authService = AuthService({
    ...config.api.jwt,
    ...config.backend.jobs,
  }, db)

  const staticFileService = StaticFileService({ basePath: config.basePath })
  const frameService = FrameService({ basePath: config.basePath })

  const schedulerService = SchedulerService({
    db,
    io,
    ...config.scheduler,
  })

  const moduleService = ModuleService(`${config.basePath}/modules`)

  mountApi(app, {
    db,
    moduleService,
    authService,
    staticFileService,
    frameService, 
    schedulerService,
    password: {
      saltRounds: config.passwordSaltRounds,
    },
  })
  mountWebsocket(io, config, db)

  schedulerService.startScheduler(io)
  app.set('io', io)
  http.listen(3333, () => console.log('listening on 3333...'))
}

init()
