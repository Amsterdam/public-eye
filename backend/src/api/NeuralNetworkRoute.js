const Router = require('express-promise-router')
const { checkToken } = require('./AuthMiddleware')
const NeuralNetworkStore = require('../data/NeuralNetworkStore')

const getModelsForNN = (nnStore) => async (req, res) => {
  try {
    const models = await nnStore.getModels(req.params.nnId)

    res.send(models).end()
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const getNeuralNetworks = (nnStore) => async (req, res) => {
  try {
    const neuralNetworks = await nnStore.getNeuralNetworks()

    res.send(neuralNetworks).end()
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const getAllModels = (nnStore) => async (req, res) => {
  try {
    const models = req.query.query
      ? (
        await nnStore.getAllModelsBySearch(
          req.query.query,
          req.query.skip,
          req.query.limit
        )
      ) : await nnStore.getAllModels(req.query.skip, req.query.limit)

    const count = req.query.query
      ? await nnStore.getAllModelsBySearchCount(req.query.query)
      : await nnStore.getAllModelsCount()

    res.send({ items: models, count }).end()
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const insertModel = (nnStore) => async (req, res) => {
  try {
    if (req.file.path) {
      const succes = await nnStore.insertModel(req.params.nnId, req.file.path, req.query.name)
      if (succes) {
        return res.send(201).end()
      } else {
        return res.send(500).end()
      }
    } else {
      return res.send(500).end()
    }
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const updateModel = (nnStore) => async (req, res) => {
  try {
    const model = await nnStore.updateAnnotation(req.params.id, req.body)

    if (model) {
      res.send(model).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const insertModelTag = (nnStore) => async (req, res) => {
  try {
    const tag = await nnStore.insertModelTag(req.body)

    if (tag) {
      res.send(tag).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const getModelTags = (nnStore) => async (req, res) => {
  try {
    const modelTags = await nnStore.getModelTags()

    if (modelTags) {
      res.send(modelTags).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const insertModelTagLink = (nnStore) => async (req, res) => {
  try {
    const modelTagLink = await nnStore.insertModelTagLink(req.params.modelId, req.params.tagId)

    if (modelTagLink) {
      res.send(modelTagLink).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const deleteModelTagLink = (nnStore) => async (req, res) => {
  try {
    const success = await nnStore.deleteModelTagLink(req.params.modelId, req.params.tagId)

    if (success) {
      res.sendStatus(204).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const getTagsForModel = (nnStore) => async (req, res) => {
  try {
    const tags = await nnStore.getTagsForModel(req.params.modelId)

    if (tags) {
      res.send(tags).end()
    } else {
      res.sendStatus(404).end()
    }
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const exportModel = (nnStore) => async (req, res) => {
  try {
    const model = await nnStore.getModelById(req.params.modelId)

    if (model === null) {
      return res.sendStatus(404).end()
    }

    res.download(model.path)
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const getModel = (nnStore) => async (req, res) => {
  try {
    const model = await nnStore.getModelById(req.params.id)

    if (model === null) {
      return res.sendStatus(404).end()
    }

    res.send(model).end()
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

module.exports = (deps) => {
  const router = new Router()
  const neuralNetworkStore = NeuralNetworkStore(deps)

  router.post(
    '/models/tags',
    checkToken(deps.authService, ['trainer']),
    insertModelTag(neuralNetworkStore),
  )
  router.get(
    '/models/tags',
    checkToken(deps.authService, ['trainer']),
    getModelTags(neuralNetworkStore)
  )
  router.get(
    '/',
    checkToken(deps.authService, ['trainer', 'deployer']),
    getNeuralNetworks(neuralNetworkStore)
  )
  router.get(
    '/:nnId/models',
    checkToken(deps.authService, ['trainer', 'deployer']),
    getModelsForNN(neuralNetworkStore)
  )
  router.post(
    '/:nnId/models',
    checkToken(deps.authService, ['trainer']),
    deps.staticFileService.uploadMiddleware,
    insertModel(neuralNetworkStore)
  )
  router.get(
    '/models',
    checkToken(deps.authService),
    getAllModels(neuralNetworkStore, ['trainer'])
  )
  router.get(
    '/models/:id',
    checkToken(deps.authService),
    getModel(neuralNetworkStore, ['trainer'])
  )
  router.patch(
    '/models/:id',
    checkToken(deps.authService, ['trainer']),
    updateModel(neuralNetworkStore)
  )
  router.get(
    '/models/:modelId/tags',
    checkToken(deps.authService, ['trainer']),
    getTagsForModel(neuralNetworkStore)
  )
  router.post(
    '/models/:modelId/tags/:tagId',
    checkToken(deps.authService, ['trainer']),
    insertModelTagLink(neuralNetworkStore)
  )
  router.delete(
    '/models/:modelId/tags/:tagId',
    checkToken(deps.authService, ['trainer']),
    deleteModelTagLink(neuralNetworkStore)
  )
  router.get(
    '/models/:modelId/export',
    checkToken(deps.authService, ['trainer']),
    exportModel(neuralNetworkStore)
  )


  return router
}
