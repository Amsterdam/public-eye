import loadApp from 'common/dependencies/load_app'
import mountWebsocket from './websocket'
import mountApi from './api'
import config from './common/config/index'

const init = async () => {
  console.log(config)
  const { dependencies, app, httpServer, io } = loadApp()
  await dependencies.db.connect(config.postgres)

  mountApi(app, dependencies)
  mountWebsocket(io, config, dependencies.db)
  dependencies.schedulerService.startScheduler(io)
  app.set('io', io)
  httpServer.listen(3333, () => console.log('listening on 3333...'))
}

init()
