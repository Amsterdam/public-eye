const Router = require('express-promise-router')
const { checkToken } = require('./AuthMiddleware')
const DatasetStore = require('../data/DatasetStore')

const getAllDatasets = (datasetStore) => async (req, res) => {
  try {
    
    const datasets = await datasetStore.getAllDatasets(
      req.query.skip, req.query.limit, req.query.filter, req.query.nn_type
    )
    const datasetsCount = await datasetStore.getTotalDatasetsCount(
      req.query.filter, req.query.nn_type)

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

const getFramesAndLabelsForDatasetId = (datasetStore) => async (req, res) => {
  try {
    const dataset = await datasetStore.getDatasetById(req.params.datasetId)
    if (dataset === null) {
      res.send(404).end()
      return
    }

    if (dataset.nn_type === "density_estimation") {
      const framesAndGroundTruths = await datasetStore.getFramesAndGroundTruthsForDataset(req.params.datasetId)

      if (framesAndGroundTruths === null) {
        res.send(404).end()
        return
      }

      res.send(framesAndGroundTruths).end()
      return
    }
    if (dataset.nn_type === "object_recognition") {
      const framesAndBoundingBoxes = await datasetStore.getFramesAndBoundingBoxesForDataset(req.params.datasetId)

      if (framesAndBoundingBoxes === null) {
        res.send(404).end()
        return
      }

      res.send(framesAndBoundingBoxes).end()
      return
    }
    if (dataset.nn_type === "line_crossing_density") {
      const framePairs = await datasetStore.getLoiFramePairsForDataset(req.params.datasetId)
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

const getDataset = (datasetStore) => async (req, res) => {
  try {
    const dataset = await datasetStore.getDatasetById(req.params.id)

    if (dataset === null) {
      return res.sendStatus(404).end()
    }

    res.send(dataset).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const deleteDataset = (datasetStore) => async (req, res) => {
  try {
    const trainingRun = await datasetStore.getTrainingRunByDatasetId(req.params.id)

    if (trainingRun !== null) {
      return res.sendStatus(409)
    }

    const success = await datasetStore.deleteDatasetById(req.params.id)

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

module.exports = (deps) => {
  const router = new Router()

  const datasetStore = DatasetStore(deps)

  router.get(
    '/',
    checkToken(deps.authService, ['trainer', 'tagger']),
    getAllDatasets(datasetStore)
  )
  router.get(
    '/:id',
    checkToken(deps.authService, ['trainer', 'tagger']),
    getDataset(datasetStore)
  )
  router.delete(
    '/:id',
    checkToken(deps.authService, ['trainer', 'tagger']),
    deleteDataset(datasetStore),
  )
  router.get(
    '/:datasetId/frames',
    checkToken(deps.authService, ['trainer', 'tagger']),
    getFramesAndLabelsForDatasetId(datasetStore)
  )
  return router
}
