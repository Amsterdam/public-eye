import Router from 'express-promise-router'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import DatasetStore, { DatasetStoreType } from 'data/DatasetStore'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

const getAllDatasets = (datasetStore: DatasetStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const datasets = await datasetStore.getAllDatasets(
      Number(req.query.skip),
      Number(req.query.limit),
      req.query.filter && String(req.query.filter),
      req.query.filter && String(req.query.nn_type),
    )
    const datasetsCount = await datasetStore.getTotalDatasetsCount(
      req.query.filter && String(req.query.filter),
      req.query.filter && String(req.query.nn_type),
    )

    if (datasets === null || datasetsCount === null) {
      res.send(404).end()
      return
    }

    res.send({ items: datasets, count: datasetsCount }).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getFramesAndLabelsForDatasetId = (
  datasetStore: DatasetStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const dataset = await datasetStore.getDatasetById(
      Number(req.params.datasetId),
    )

    if (dataset === null) {
      res.send(404).end()
      return
    }

    if (dataset.nn_type === 'density_estimation') {
      const framesAndGroundTruths = await datasetStore.getFramesAndGroundTruthsForDataset(
        req.params.datasetId,
      )

      if (framesAndGroundTruths === null) {
        res.send(404).end()
        return
      }

      res.send(framesAndGroundTruths).end()
      return
    }
    if (dataset.nn_type === 'object_recognition') {
      const framesAndBoundingBoxes = await datasetStore.getFramesAndBoundingBoxesForDataset(
        Number(req.params.datasetId),
      )

      if (framesAndBoundingBoxes === null) {
        res.send(404).end()
        return
      }

      res.send(framesAndBoundingBoxes).end()
      return
    }
    if (dataset.nn_type === 'line_crossing_density') {
      const framePairs = await datasetStore.getLoiFramePairsForDataset(
        Number(req.params.datasetId),
      )

      if (framePairs === null) {
        res.send(404).end()
        return
      }

      res.send(framePairs).end()
      return
    }

    res.send(404).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getDataset = (datasetStore: DatasetStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const dataset = await datasetStore.getDatasetById(
      Number(req.params.id),
    )

    if (dataset === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(dataset).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const deleteDataset = (datasetStore: DatasetStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const trainingRun = await datasetStore.getTrainingRunByDatasetId(
      Number(req.params.id),
    )

    if (trainingRun !== null) {
      res.sendStatus(409)
      return
    }

    const success = await datasetStore.deleteDatasetById(
      Number(req.params.id),
    )

    if (success) {
      res.sendStatus(204).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const DatasetsRoute = (deps: Dependencies): RouterType => {
  const router = Router()

  const datasetStore = DatasetStore(deps)

  router.get(
    '/',
    checkToken(deps.authService, ['trainer', 'tagger']),
    getAllDatasets(datasetStore),
  )
  router.get(
    '/:id',
    checkToken(deps.authService, ['trainer', 'tagger']),
    getDataset(datasetStore),
  )
  router.delete(
    '/:id',
    checkToken(deps.authService, ['trainer', 'tagger']),
    deleteDataset(datasetStore),
  )
  router.get(
    '/:datasetId/frames',
    checkToken(deps.authService, ['trainer', 'tagger']),
    getFramesAndLabelsForDatasetId(datasetStore),
  )
  return router
}

export default DatasetsRoute
