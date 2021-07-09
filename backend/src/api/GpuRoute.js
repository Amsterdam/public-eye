const Router = require('express-promise-router')
const R = require('ramda')
const { execSync, exec } = require('child_process')
const { checkToken } = require('./AuthMiddleware')
const papa = require('papaparse')

const getGpuCount = () => async (req, res) => {
  try {
    const count = R.pipe( 
      R.split('\n'),
      R.filter(R.includes('GPU')),
      R.length,
    )(String(execSync('nvidia-smi -L')))

    res.send({ count }).end()
  } catch (e) {
    res.send({ count: 0 }).end()
    console.error(e)
  }
}

const extractMemoryNumber = (memoryString) => {
  try {
    return Number(memoryString.replace('MiB', '').replace(' ', ''))
  } catch (e) {
    console.error(e)
    return null
  }
}

const parseGpuInfoCsv = (csv) => ({
  uuid: csv.uuid,
  name: csv[" name"],
  "memory.used [MiB]": extractMemoryNumber(csv[" memory.used [MiB]"]),
  "memory.free [MiB]": extractMemoryNumber(csv[" memory.free [MiB]"]),
  "memory.total [MiB]": extractMemoryNumber(csv[" memory.total [MiB]"]),
  "temperature.gpu": csv[" temperature.gpu"],
})

const getGpuInfo = () => async (req, res) => {
  try {
    const command = "nvidia-smi --format=csv --query-gpu=uuid,name,memory.used,memory.free,memory.total,temperature.gpu"

    const info = String(execSync(command))

    const json = papa.parse(
      info,
      {
        header: true,
        dynamicTyping: true,
        keepEmptyRows: 'greedy',
      }
    ).data.filter(({ uuid }) => uuid).map(parseGpuInfoCsv)

    res.send(json).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

module.exports = (deps) => {

  const router = new Router()

  router.get(
    '/available_count',
    checkToken(deps.authService, ['trainer', 'deployer']),
    getGpuCount())

  router.get(
    '/info',
    checkToken(deps.authService, ['trainer', 'deployer']),
    getGpuInfo()
  )
  return router
}