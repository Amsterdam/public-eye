import { Server as IoServer } from 'socket.io'
import { Config } from 'common/config'
import AuthService, { AuthServiceType } from 'services/AuthService'
import StaticFileService, { StaticFileServiceType } from 'services/StaticFileService'
import FrameService, { FrameServiceType } from 'services/FrameService'
import SchedulerService, { SchedulerServiceType } from 'services/SchedulerService'
import ModuleService, { ModuleServiceType } from 'services/ModuleService'
import db, { Database } from 'db'

export type Dependencies = {
  db: Database,
  moduleService: ModuleServiceType,
  authService: AuthServiceType,
  staticFileService: StaticFileServiceType,
  frameService: FrameServiceType,
  schedulerService: SchedulerServiceType,
  password: {
    saltRounds: number,
  },
}

const loadDependencies = (
  io: IoServer,
  config: Config,
): Dependencies => {
  const authService = AuthService({
    ...config.api.jwt,
    ...config.backend.jobs,
  }, db)
  const staticFileService = StaticFileService(config)
  const frameService = FrameService(config)
  const schedulerService = SchedulerService({
    db,
    io,
    ...config.scheduler,
  })
  const moduleService = ModuleService(`${config.basePath}/modules`)

  return {
    db,
    moduleService,
    authService,
    staticFileService,
    frameService,
    schedulerService,
    password: {
      saltRounds: config.passwordSaltRounds,
    },
  }
}

export default loadDependencies
