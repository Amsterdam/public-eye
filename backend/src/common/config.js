const R = require('ramda')
const os = require('os')

const configPath = process.env['EAGLE_EYE_PATH'] + '/config.json'

const masterConfig = require(configPath)

let sourceCmd = ``
let command = ``

if (os.platform() == 'win32') {
  sourceCmd =  `${process.env['EAGLE_EYE_PATH']}\\eagle_eye_p3\\Scripts\\activate.ps1`
  command = 'powershell.exe'
} else {
  sourceCmd = `source ${process.env['EAGLE_EYE_PATH']}/eagle_eye_p3/bin/activate`
  command = 'bash'
}

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
    source_cmd: sourceCmd,
    command,
  },
  basePath: process.env['EAGLE_EYE_PATH'],
  passwordSaltRounds: 10,
})
