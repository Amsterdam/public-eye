import Router from 'express-promise-router'
import {
  pipe,
  split,
  filter,
  length,
  includes,
} from 'ramda'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import { execSync } from 'child_process'
import papa from 'papaparse'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

const getGpuCount = () => async (
  req: Request,
  res: Response,
) => {
  try {
    const count = pipe(
      split('\n'),
      filter(includes('GPU')),
      length,
    )(String(execSync('nvidia-smi -L')))

    res.send({ count }).end()
  } catch (e) {
    res.send({ count: 0 }).end()
    console.error(e)
  }
}

const extractMemoryNumber = (memoryString: string): number | null => {
  try {
    return Number(memoryString.replace('MiB', '').replace(' ', ''))
  } catch (e) {
    console.error(e)
    return null
  }
}

type CsvType = {
  uuid: string,
  ' name': string,
  ' memory.used [MiB]': string,
  ' memory.free [MiB]': string,
  ' memory.total [MiB]': string,
  ' temperature.gpu': string,
}

const parseGpuInfoCsv = (csv: CsvType) => ({
  uuid: csv.uuid,
  name: csv[' name'],
  'memory.used [MiB]': extractMemoryNumber(csv[' memory.used [MiB]']),
  'memory.free [MiB]': extractMemoryNumber(csv[' memory.free [MiB]']),
  'memory.total [MiB]': extractMemoryNumber(csv[' memory.total [MiB]']),
  'temperature.gpu': csv[' temperature.gpu'],
})

const getGpuInfo = () => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const command = 'nvidia-smi --format=csv --query-gpu=uuid,name,memory.used,memory.free,memory.total,temperature.gpu'

    const info = String(execSync(command))

    const json = papa.parse<CsvType>(
      info,
      {
        header: true,
        dynamicTyping: true,
      },
    ).data.filter(({ uuid }: CsvType) => uuid).map(parseGpuInfoCsv)

    res.send(json).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const gpuRoute = (deps: Dependencies): RouterType => {
  const router = Router()

  router.get(
    '/available_count',
    checkToken(deps.authService, ['trainer', 'deployer']),
    getGpuCount(),
  )

  router.get(
    '/info',
    checkToken(deps.authService, ['trainer', 'deployer']),
    getGpuInfo(),
  )
  return router
}

export default gpuRoute
