const Router = require('express-promise-router')
const { checkToken } = require('./AuthMiddleware')
const TrainingRunStore = require('../data/TrainingRunStore')
const NeuralNetworkStore = require('../data/NeuralNetworkStore')
const UserStore = require('../data/UserStore')
const JobStore = require('../data/JobStore')

const getAllTrainingRuns = (trainingRunStore, userStore, authService) => async (req, res) => {
  try {
    const token = req.query.tk || req.headers['x-access-token']
    const { userId } = await authService.decodeJwt(token)
    const user = await userStore.getUserById(userId)
    const userRoleNames = user.roles.map(({ name }) => name)

    const trainingRuns = userRoleNames.includes('admin')
      ? await trainingRunStore.getAllTrainingRuns(req.query.skip, req.query.limit)
      : await trainingRunStore.getAllTrainingRunsByUserId(userId, req.query.skip, req.query.limit)

    const count = userRoleNames.includes('admin')
      ? await trainingRunStore.getTotalTrainingRunsCount()
      : await trainingRunStore.getTotalTrainingRunsCountByUserId(userId)

    if (trainingRuns === null) {
      return res.send(404).end()
    }
  
    res.send({ items: trainingRuns, count }).end()
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const getScoresForTrainingRun = (store) => async (req, res) => {
  try {
    const scores = await store.getScoresByTrainingRunId(req.params.trainingRunId)

    if (scores === null) {
      return res.send(404).end()
    }
  
    res.send(scores).end()
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const attempDelete = async (path, staticFileService) => {
  try {
    await staticFileService.deleteFile(path)
  } catch(e) {
    console.error(e)
  }
}

const deleteTrainingRun = (trainingRunStore, neuralNetworkStore, jobStore, staticFileService) => async (req, res) => {
  try {
    const trainingRun = await trainingRunStore.getTrainingRunById(req.params.trainingRunId)

    if (!trainingRun) {
      res.sendStatus(404).end()
    }
    // delete log
    if (trainingRun.log_file_path) {
      await attempDelete(trainingRun.log_file_path, staticFileService)
    }

    // delete scores
    await trainingRunStore.deleteScoresByTrainingRunId(req.params.trainingRunId)

    // delete training run
    await trainingRunStore.deleteTrainingRunById(req.params.trainingRunId)

    // delete train config
    if (trainingRun.config_id) {
      const trainConfig = await trainingRunStore.getTrainConfigById(trainingRun.config_id)
      await attempDelete(trainConfig.path, staticFileService)
      await trainingRunStore.deleteTrainConfigById(trainConfig.id)
    }

    // delete job
    await attempDelete(trainingRun.log_path, staticFileService)
    await jobStore.deleteJobById(trainingRun.job_id)

    // delete model
    if (trainingRun.model_id) {
      const model = await neuralNetworkStore.getModelById(trainingRun.model_id)
      await neuralNetworkStore.deleteSelectedLabels(model.id)
      const success = await neuralNetworkStore.deleteModelById(model.id)

      // Model might be used by streaming instance, in that case it can't be deleted
      if (success) {
        await attempDelete(model.path, staticFileService)
      } else {
        console.log('Model not deleted because of reference')
      }
    }

    return res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const exportModel = (trainingRunStore, nnStore) => async (req, res) => {
  try {
    const tr = await trainingRunStore.getTrainingRunByJobId(req.params.id)

    const model = await nnStore.getModelById(tr.model_id)
    res.download(model.path)
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const getTrainingRunById = (trainingRunStore) => async (req, res) => {
  try {
    const trainingRun = await trainingRunStore.getTrainingRunByJobId(req.params.jobId)

    if (trainingRun === null) {
      return res.sendStatus(404).end()
    }
    
    res.send(trainingRun).end()
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}


module.exports = (deps) => {

  const router = new Router()

  const trainingRunStore = TrainingRunStore(deps)
  const neuralNetworkStore = NeuralNetworkStore(deps)
  const jobStore = JobStore(deps)
  const userStore = UserStore(deps)

  router.get(
    '/:jobId',
    checkToken(deps.authService, ['trainer']),
    getTrainingRunById(trainingRunStore)
  )
  router.delete(
    '/:trainingRunId',
    checkToken(deps.authService, ['trainer']),
    deleteTrainingRun(
      trainingRunStore,
      neuralNetworkStore,
      jobStore,
      deps.staticFileService
    )
  )
  router.get(
    '/',
    checkToken(deps.authService, ['trainer']),
    getAllTrainingRuns(trainingRunStore, userStore, deps.authService)
  )
  router.get(
    '/:trainingRunId/scores',
    checkToken(deps.authService, ['trainer']),
    getScoresForTrainingRun(trainingRunStore)
  )
  router.get(
    '/:id/export',
    checkToken(deps.authService, ['trainer']),
    exportModel(trainingRunStore, neuralNetworkStore),
  )
  return router
}
  