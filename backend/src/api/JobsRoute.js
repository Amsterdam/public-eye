const R = require('ramda')
const Router = require('express-promise-router')
const UserStore = require('../data/UserStore')
const JobStore = require('../data/JobStore')
const TrainingRunStore = require('../data/TrainingRunStore')
const { checkTokenJob, checkToken } = require('./AuthMiddleware')

const postJob = (schedulerService, authService) => async (req, res) => {
  try {
    const { scriptName, scriptArgs } = req.body
    const token = req.query.tk || req.headers['x-access-token']
    const { userId } = await authService.decodeJwt(token)

    if (scriptName == null) {
      return res.send(400)
    }

    const scriptArgsJson = scriptArgs ? JSON.stringify(scriptArgs) : '{}'

    const scheduledId = await schedulerService.scheduleJob(
      scriptName, scriptArgsJson, userId,
    )
    if (scheduledId !== null) {
      return res.sendStatus(201)
    } else {
      return res.sendStatus(400)
    }
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const postTrainJob = (schedulerService, authService, trainingRunStore) => async (req, res) => {
  try {
    const { scriptName, scriptArgs } = req.body
    const token = req.query.tk || req.headers['x-access-token']
    const { userId } = await authService.decodeJwt(token)

    const scriptArgsJson = scriptArgs ? JSON.stringify(scriptArgs) : '{}'

    const scheduledId = await schedulerService.scheduleJob(
      scriptName, scriptArgsJson, userId,
    )
    const trainingRun = await trainingRunStore.insertTrainingRun(
      scriptName, scheduledId, scriptArgs["train_dataset_id"], scriptArgs["val_dataset_id"])

    if (scheduledId !== null) {
      // emit training run via websocket
      req.app.get('io').emit('training-run', { event_type: 'new', data: trainingRun })

      return res.send(trainingRun)
    } else {
      return res.sendStatus(400)
    }
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const getJobs = (
  authService,
  jobStore,
  userStore,
) => async (req, res) => {
  try {
    const token = req.query.tk || req.headers['x-access-token']
    const { userId } = await authService.decodeJwt(token)
    const user = await userStore.getUserById(userId)
    const userRoleNames = user.roles.map(({ name }) => name)
    
    const jobs = userRoleNames.includes('admin')
      ? await jobStore.getJobs(req.query.script_name, req.query.skip, req.query.limit)
      : await jobStore.getJobsByUserId(userId, req.query.script_name, req.query.skip, req.query.limit)

    const count = userRoleNames.includes('admin')
      ? await jobStore.getTotalJobsCount(req.query.script_name)
      : await jobStore.getTotalJobsCountByUserId(userId, req.query.script_name)
  
    return res.json({ items: jobs, count })
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const stopJob = (schedulerService) => async (req, res) => {
  try {
    const jobId = req.params.jobId

    const stopped = await schedulerService.stopJob(jobId)
    if (stopped) {
      return res.sendStatus(204)
    } else {
      return res.sendStatus(400)
    }
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const killJob = (schedulerService) => async (req, res) => {
  try {
    const jobId = req.params.jobId

    const killed = await schedulerService.killJob(jobId)
    if (killed) {
      return res.sendStatus(204)
    } else {
      return res.sendStatus(400)
    }
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const getJobLog = (staticFileService, jobStore) => async (req, res) => {
  try {
    const jobEntity = await jobStore.getJobById(req.params.jobId)

    const { content, size, } = await staticFileService.serveFileFromEnd(
      jobEntity.log_path, req.query)
    res.send({ content, size }).end()
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const restartJob = (jobStore) => async (req, res) => {
  try {
    await jobStore.rescheduleJob(req.params.jobId)

    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const deleteJob = (staticFileService, jobStore) => async (req, res) => {
  try {
    const job = await jobStore.getJobById(req.params.jobId)

    if (job === null) {
      res.sendStatus(404).end()
    }

    if (job.job_status === 'running') {
      return res.sendStatus(409).send('Cannot delete job that is running. Has to be stopped first.').end()
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
    return res.sendStatus(500).end()
  }
}

const getJob = (jobStore) => async (req, res) => {
  try {
    const job = await jobStore.getJobById(req.params.jobId)

    if (job === null) {
      res.sendStatus(404).end()
    }

    res.send(job).end()
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const getArgumentSpecs = (moduleService) => (req, res) => {
  try {
    const argsSpec = moduleService.getArgumentSpecs()

    res.send(argsSpec).end()
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}


module.exports = (deps) => {
  const router = new Router()

  const jobStore = JobStore(deps)
  const trainingRunStore = TrainingRunStore(deps)
  const userStore = UserStore(deps)

  const getJobScriptNameFromBody = (req) => {
    return req.body.scriptName || null
  }

  const getJobScriptNameFromParam = async (req) => {
    const jobId = req.params.jobId

    const job = await jobStore.getJobById(jobId)

    if (job) {
      return R.pipe(
        R.split('/'),
        R.last
      )(job.job_script_path)
    }
    return null
  }

  router.get(
    '/arg_spec',
    checkToken(deps.authService),
    getArgumentSpecs(deps.moduleService)
  )
  router.get(
    '/',
    checkToken(deps.authService),
    getJobs(deps.authService, jobStore, userStore))
  router.post(
    '/',
    checkTokenJob(deps.authService, getJobScriptNameFromBody),
    postJob(deps.schedulerService, deps.authService, userStore))
  router.post(
    '/train',
    checkToken(deps.authService, ['trainer']),
    postTrainJob(deps.schedulerService, deps.authService, trainingRunStore))
  router.post(
    '/:jobId/stop',
    checkTokenJob(deps.authService, getJobScriptNameFromParam),
    stopJob(deps.schedulerService))
  router.post(
    '/:jobId/kill',
    checkToken(deps.authService, ['admin']),
    killJob(deps.schedulerService))
  router.get(
    '/:jobId',
    checkTokenJob(deps.authService, getJobScriptNameFromParam),
    getJob(jobStore)
  )
  router.delete(
    '/:jobId',
    checkTokenJob(deps.authService, getJobScriptNameFromParam),
    deleteJob(deps.staticFileService, jobStore))
  router.get(
    '/:jobId/log', 
    checkToken(deps.authService),
    getJobLog(deps.staticFileService, jobStore))
  router.post(
    '/:jobId/restart',
    checkTokenJob(deps.authService, getJobScriptNameFromParam),
    restartJob(jobStore))

  return router
}
