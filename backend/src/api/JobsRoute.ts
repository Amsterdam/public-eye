import {
  pipe,
  split,
  last,
} from 'ramda'
import Router from 'express-promise-router'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import { Server } from 'socket.io'
import UserStore, { UserStoreType } from 'data/UserStore'
import JobStore, { JobStoreType } from 'data/JobStore'
import TrainingRunStore, { TrainingRunStoreType } from 'data/TrainingRunStore/index'
import { SchedulerServiceType } from 'services/SchedulerService'
import { AuthServiceType } from 'services/AuthService'
import { StaticFileServiceType } from 'services/StaticFileService'
import { ModuleServiceType } from 'services/ModuleService'
import { Dependencies } from 'common/dependencies'
import { checkTokenJob, checkToken } from './AuthMiddleware'

type PostJobRequestBody = {
  scriptName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scriptArgs: Record<string, any>,
}

const postJob = (
  schedulerService: SchedulerServiceType,
  authService: AuthServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { scriptName, scriptArgs } = req.body as PostJobRequestBody
    const token = req.query.tk || req.headers['x-access-token']
    const decodedToken = await authService.decodeJwt(String(token))
    if (!decodedToken) {
      res.send(401).end()
      return
    }
    const { userId } = decodedToken

    if (scriptName == null) {
      res.send(400).end()
      return
    }

    const scriptArgsJson = scriptArgs ? JSON.stringify(scriptArgs) : '{}'

    const scheduledId = await schedulerService.scheduleJob(
      scriptName, scriptArgsJson, userId,
    )
    if (scheduledId !== null) {
      res.sendStatus(201).end()
      return
    }
    res.sendStatus(400).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const postTrainJob = (
  schedulerService: SchedulerServiceType,
  authService: AuthServiceType,
  trainingRunStore: TrainingRunStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { scriptName, scriptArgs } = req.body as PostJobRequestBody
    const token = req.query.tk || req.headers['x-access-token']
    const decodedToken = await authService.decodeJwt(String(token))
    if (!decodedToken) {
      res.send(401).end()
      return
    }
    const { userId } = decodedToken

    const scriptArgsJson = scriptArgs ? JSON.stringify(scriptArgs) : '{}'

    const scheduledId = await schedulerService.scheduleJob(
      scriptName, scriptArgsJson, userId,
    )

    if (!scheduledId) {
      res.send(500).end()
      return
    }

    const trainingRun = await trainingRunStore.insertTrainingRun(
      scriptName,
      scheduledId,
      scriptArgs.train_dataset_id,
      scriptArgs.val_dataset_id,
    )

    if (scheduledId !== null) {
      // emit training run via websocket
      (req.app.get('io') as Server).emit('training-run', { event_type: 'new', data: trainingRun })

      res.send(trainingRun)
      return
    }
    res.sendStatus(400)
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getJobs = (
  authService: AuthServiceType,
  jobStore: JobStoreType,
  userStore: UserStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const token = req.query.tk || req.headers['x-access-token']
    const decodedToken = await authService.decodeJwt(String(token))
    if (!decodedToken) {
      res.send(401).end()
      return
    }

    const { userId } = decodedToken
    const user = await userStore.getUserById(userId)
    const userRoleNames = user
      ? user.roles.map(({ name }) => name)
      : []

    const jobs = userRoleNames.includes('admin')
      ? await jobStore.getJobs(
        req.query.script_name && String(req.query.script_name),
        req.query.skip ? Number(req.query.skip) : undefined,
        req.query.limit ? Number(req.query.limit) : undefined,
      ) : await jobStore.getJobsByUserId(
        userId,
        req.query.script_name && String(req.query.script_name),
        req.query.skip ? Number(req.query.skip) : undefined,
        req.query.limit ? Number(req.query.limit) : undefined,
      )

    const count = userRoleNames.includes('admin')
      ? await jobStore.getTotalJobsCount(
        req.query.script_name && String(req.query.script_name)
      ) : await jobStore.getTotalJobsCountByUserId(
        userId,
        req.query.script_name && String(req.query.script_name),
      )

    res.json({ items: jobs, count }).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const stopJob = (
  schedulerService: SchedulerServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { jobId } = req.params

    const stopped = await schedulerService.stopJob(Number(jobId))
    if (stopped) {
      res.sendStatus(204).end()
      return
    }
    res.sendStatus(400)
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const killJob = (
  schedulerService: SchedulerServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { jobId } = req.params

    const killed = await schedulerService.killJob(Number(jobId))
    if (killed) {
      res.sendStatus(204).end()
      return
    }
    res.sendStatus(400).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getJobLog = (
  staticFileService: StaticFileServiceType,
  jobStore: JobStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const jobEntity = await jobStore.getJobById(
      Number(req.params.jobId),
    )
    if (!jobEntity) {
      res.send(404).end()
      return
    }

    const { content, size } = await staticFileService.serveFileFromEnd(
      jobEntity.log_path,
      req.query as unknown as { maxSize: number, offset: number },
    )
    res.send({ content, size }).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const restartJob = (
  jobStore: JobStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await jobStore.rescheduleJob(Number(req.params.jobId))

    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const deleteJob = (
  staticFileService: StaticFileServiceType,
  jobStore: JobStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const job = await jobStore.getJobById(Number(req.params.jobId))

    if (job === null) {
      res.sendStatus(404).end()
      return
    }

    if (job.job_status === 'running') {
      res.sendStatus(409).send('Cannot delete job that is running. Has to be stopped first.').end()
      return
    }

    await staticFileService.deleteFile(job.log_path)
    const success = await jobStore.deleteJobById(job.id)

    if (success) {
      res.sendStatus(204).end()
    } else {
      res.sendStatus(409).end()
    }
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getJob = (jobStore: JobStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const job = await jobStore.getJobById(Number(req.params.jobId))

    if (job === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(job).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getArgumentSpecs = (
  moduleService: ModuleServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const argsSpec = moduleService.getArgumentSpecs()

    res.send(argsSpec).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const makeGetJobScriptNameFromParam = (jobStore: JobStoreType) => async (
  req: Request,
): Promise<string | null> => {
  const { jobId } = req.params

  const job = await jobStore.getJobById(Number(jobId))

  if (job) {
    return pipe(
      split('/'),
      last,
    )(job.job_script_path) as string
  }
  return null
}

const getJobScriptNameFromBody = async (req: Request): Promise<string | null> => (
  (req.body as PostJobRequestBody).scriptName || null
)

const jobsRoute = (deps: Dependencies): RouterType => {
  const router = Router()

  const jobStore = JobStore(deps)
  const trainingRunStore = TrainingRunStore(deps)
  const userStore = UserStore(deps)
  const getJobScriptNameFromParam = makeGetJobScriptNameFromParam(jobStore)

  router.get(
    '/arg_spec',
    checkToken(deps.authService),
    getArgumentSpecs(deps.moduleService),
  )
  router.get(
    '/',
    checkToken(deps.authService),
    getJobs(deps.authService, jobStore, userStore),
  )
  router.post(
    '/',
    checkTokenJob(deps.authService, getJobScriptNameFromBody),
    postJob(deps.schedulerService, deps.authService),
  )
  router.post(
    '/train',
    checkToken(deps.authService, ['trainer']),
    postTrainJob(deps.schedulerService, deps.authService, trainingRunStore),
  )
  router.post(
    '/:jobId/stop',
    checkTokenJob(deps.authService, getJobScriptNameFromParam),
    stopJob(deps.schedulerService),
  )
  router.post(
    '/:jobId/kill',
    checkToken(deps.authService, ['admin']),
    killJob(deps.schedulerService),
  )
  router.get(
    '/:jobId',
    checkTokenJob(deps.authService, getJobScriptNameFromParam),
    getJob(jobStore),
  )
  router.delete(
    '/:jobId',
    checkTokenJob(deps.authService, getJobScriptNameFromParam),
    deleteJob(deps.staticFileService, jobStore),
  )
  router.get(
    '/:jobId/log',
    checkToken(deps.authService),
    getJobLog(deps.staticFileService, jobStore),
  )
  router.post(
    '/:jobId/restart',
    checkTokenJob(deps.authService, getJobScriptNameFromParam),
    restartJob(jobStore),
  )

  return router
}

export default jobsRoute
