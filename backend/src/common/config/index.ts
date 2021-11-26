import {
  mergeDeepLeft,
} from 'ramda'
import os from 'os'
import masterConfig from '../../../../config.json'

let sourceCmd = ''
let command = ''

if (os.platform() === 'win32') {
  sourceCmd = `${String(process.env.EAGLE_EYE_PATH)}\\eagle_eye_p3\\Scripts\\activate.ps1`
  command = 'powershell.exe'
} else {
  sourceCmd = `source ${process.env.EAGLE_EYE_PATH}/eagle_eye_p3/bin/activate`
  command = 'bash'
}

export type PostgresConfig = {
  username: string,
  password: string,
  host: string,
  port: number,
  database: string,
  test_database: string
}

export type JwtConfig = {
  secret: string
}

export type SchedulerConfig = {
  schedulerInterval: number,
  logDirectory: string,
  maxParallel: number,
  source_cmd: string,
  command: string,
}

export type Config = {
  postgres: PostgresConfig,
  backend: {
    url: string,
    token: string,
    jobs: {
      authorization: Record<string, string[]>
    }
  },
  api: {
    jwt: JwtConfig
  },
  scheduler: SchedulerConfig,
  basePath: string,
  passwordSaltRounds: number,
}

const config = mergeDeepLeft(masterConfig, {
  api: {
    jwt: {
      secret: '0LmZFC23x*n1zV<w-p,"-_^@V(u/<Y',
    },
  },
  scheduler: {
    schedulerInterval: 1000,
    logDirectory: `${String(process.env.EAGLE_EYE_PATH)}/.scheduler`,
    maxParallel: 4,
    source_cmd: sourceCmd,
    command,
  },
  basePath: process.env.EAGLE_EYE_PATH,
  passwordSaltRounds: 10,
}) as Config

if (process.env.POSTGRES_PASSWORD) {
  config.postgres.password = process.env.POSTGRES_PASSWORD
}

if (process.env.POSTGRES_USER) {
  config.postgres.username = process.env.POSTGRES_USER
}

if (process.env.POSTGRES_TEST_DATABASE) {
  config.postgres.test_database = process.env.POSTGRES_TEST_DATABASE
}

if (process.env.POSTGRES_HOST) {
  config.postgres.host = process.env.POSTGRES_HOST
}

export default config