const R = require('ramda')

const configPath = process.env['EAGLE_EYE_PATH'] + '/config.json'

const masterConfig = require(configPath)

module.exports = R.mergeDeepLeft(masterConfig, {
  api: {
    jwt: {
      secret: '0LmZFC23x*n1zV<w-p,"-_^@V(u/<Y'
    }
  },
  scheduler : {
    schedulerInterval: 1000,
    logDirectory: process.env['EAGLE_EYE_PATH'] + '/.scheduler',
    maxParallel: 4,
    source_cmd: `source ${process.env['EAGLE_EYE_PATH']}/eagle_eye_p3/bin/activate`,
    command: 'bash',
  },
  basePath: process.env['EAGLE_EYE_PATH'],
  passwordSaltRounds: 10,
})
