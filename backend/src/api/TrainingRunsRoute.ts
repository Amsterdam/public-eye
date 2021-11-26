import Router from 'express-promise-router'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import TrainingRunStore, { TrainingRunStoreType } from 'data/TrainingRunStore/index'
import NeuralNetworkStore, { NeuralNetworkStoreType } from 'data/NeuralNetworkStore'
import UserStore, { UserStoreType } from 'data/UserStore'
import JobStore, { JobStoreType } from 'data/JobStore'
import { AuthServiceType } from 'services/AuthService'
import { StaticFileServiceType } from 'services/StaticFileService'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

const getAllTrainingRuns = (
  trainingRunStore: TrainingRunStoreType,
  userStore: UserStoreType,
  authService: AuthServiceType,
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
    const user = await userStore.getUserById(Number(userId))
    const userRoleNames = user
      ? user.roles.map(({ name }) => name)
      : []

    const trainingRuns = userRoleNames.includes('admin')
      ? await trainingRunStore.getAllTrainingRuns(
        req.query.skip ? Number(req.query.skip): undefined,
        req.query.skip ? Number(req.query.limit): undefined,
      ) : await trainingRunStore.getAllTrainingRunsByUserId(
        userId,
        req.query.skip ? Number(req.query.skip): undefined,
        req.query.skip ? Number(req.query.limit) : undefined,
      )

    const count = userRoleNames.includes('admin')
      ? await trainingRunStore.getTotalTrainingRunsCount()
      : await trainingRunStore.getTotalTrainingRunsCountByUserId(userId)

    if (trainingRuns === null) {
      res.send(404).end()
      return
    }

    res.send({ items: trainingRuns, count }).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getScoresForTrainingRun = (
  store: TrainingRunStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const scores = await store.getScoresByTrainingRunId(
      Number(req.params.trainingRunId),
    )

    if (scores === null) {
      res.send(404).end()
      return
    }

    res.send(scores).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const attempDelete = async (
  path: string,
  staticFileService: StaticFileServiceType,
): Promise<void> => {
  try {
    await staticFileService.deleteFile(path)
  } catch (e) {
    console.error(e)
  }
}

const deleteTrainingRun = (
  trainingRunStore: TrainingRunStoreType,
  neuralNetworkStore: NeuralNetworkStoreType,
  jobStore: JobStoreType,
  staticFileService: StaticFileServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const trainingRun = await trainingRunStore.getTrainingRunById(
      Number(req.params.trainingRunId),
    )

    if (!trainingRun) {
      res.sendStatus(404).end()
      return
    }
    // delete log
    if (trainingRun.log_file_path) {
      await attempDelete(trainingRun.log_file_path, staticFileService)
    }

    // delete scores
    await trainingRunStore.deleteScoresByTrainingRunId(
      Number(req.params.trainingRunId),
    )

    // delete training run
    await trainingRunStore.deleteTrainingRunById(
      Number(req.params.trainingRunId),
    )

    // delete train config
    if (trainingRun.config_id) {
      const trainConfig = await trainingRunStore.getTrainConfigById(trainingRun.config_id)

      if (trainConfig) {
        await attempDelete(trainConfig.path, staticFileService)
        await trainingRunStore.deleteTrainConfigById(
          Number(trainConfig.id),
        )
      }
    }

    // delete job
    await attempDelete(trainingRun.log_path, staticFileService)
    await jobStore.deleteJobById(trainingRun.job_id)

    // delete model
    if (trainingRun.model_id) {
      const model = await neuralNetworkStore.getModelById(trainingRun.model_id)

      if (model) {
        await neuralNetworkStore.deleteSelectedLabels(model.id)
        const success = await neuralNetworkStore.deleteModelById(model.id)

        // Model might be used by streaming instance, in that case it can't be deleted
        if (success && model) {
          await attempDelete(model.path, staticFileService)
        } else {
          console.log('Model not deleted because of reference')
        }
      }
    }

    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const exportModel = (
  trainingRunStore: TrainingRunStoreType,
  nnStore: NeuralNetworkStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const tr = await trainingRunStore.getTrainingRunByJobId(
      Number(req.params.id),
    )

    if (tr) {
      const model = await nnStore.getModelById(tr.model_id)
      if (model) {
        res.download(model.path)
      } else {
        res.send(404).end()
        return
      }
    } else {
      res.send(404).end()
      return
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getTrainingRunById = (
  trainingRunStore: TrainingRunStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const trainingRun = await trainingRunStore.getTrainingRunByJobId(
      Number(req.params.jobId),
    )

    if (trainingRun === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(trainingRun).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const TrainingRunsRoute = (deps: Dependencies): RouterType => {
  const router = Router()

  const trainingRunStore = TrainingRunStore(deps)
  const neuralNetworkStore = NeuralNetworkStore(deps)
  const jobStore = JobStore(deps)
  const userStore = UserStore(deps)

  router.get(
    '/:jobId',
    checkToken(deps.authService, ['trainer']),
    getTrainingRunById(trainingRunStore),
  )
  router.delete(
    '/:trainingRunId',
    checkToken(deps.authService, ['trainer']),
    deleteTrainingRun(
      trainingRunStore,
      neuralNetworkStore,
      jobStore,
      deps.staticFileService,
    ),
  )
  router.get(
    '/',
    checkToken(deps.authService, ['trainer']),
    getAllTrainingRuns(trainingRunStore, userStore, deps.authService),
  )
  router.get(
    '/:trainingRunId/scores',
    checkToken(deps.authService, ['trainer']),
    getScoresForTrainingRun(trainingRunStore),
  )
  router.get(
    '/:id/export',
    checkToken(deps.authService, ['trainer']),
    exportModel(trainingRunStore, neuralNetworkStore),
  )
  return router
}

export default TrainingRunsRoute
