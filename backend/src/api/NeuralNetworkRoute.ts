import Router from 'express-promise-router'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import NeuralNetworkStore, { NeuralNetworkStoreType } from 'data/NeuralNetworkStore'
import { StaticFileServiceType } from 'services/StaticFileService'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

const getModelsForNN = (nnStore: NeuralNetworkStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const models = await nnStore.getModels(Number(req.params.nnId))

    res.send(models).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getNeuralNetworks = (nnStore: NeuralNetworkStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const neuralNetworks = await nnStore.getNeuralNetworks()

    res.send(neuralNetworks).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getAllModels = (nnStore: NeuralNetworkStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const models = req.query.query
      ? (
        await nnStore.getAllModelsBySearch(
          String(req.query.query),
          Number(req.query.skip),
          Number(req.query.limit),
        )
      ) : await nnStore.getAllModels(
        Number(req.query.skip),
        Number(req.query.limit),
      )

    const count = req.query.query
      ? await nnStore.getAllModelsBySearchCount(String(req.query.query))
      : await nnStore.getAllModelsCount()

    res.send({ items: models, count }).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const insertModel = (nnStore: NeuralNetworkStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (req.file && req.file.path) {
      const succes = await nnStore.insertModel(
        Number(req.params.nnId),
        req.file.path,
        String(req.query.name),
      )
      if (succes) {
        res.send(201).end()
        return
      }
      res.send(500).end()
      return
    }
    res.send(500).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const updateModel = (nnStore: NeuralNetworkStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const model = await nnStore.updateAnnotation(
      Number(req.params.id),
      req.body,
    )

    if (model) {
      res.send(model).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const insertModelTag = (nnStore: NeuralNetworkStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const tag = await nnStore.insertModelTag(req.body)

    if (tag) {
      res.send(tag).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getModelTags = (
  nnStore: NeuralNetworkStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const modelTags = await nnStore.getModelTags()

    if (modelTags) {
      res.send(modelTags).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const insertModelTagLink = (
  nnStore: NeuralNetworkStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const modelTagLink = await nnStore.insertModelTagLink(
      Number(req.params.modelId),
      Number(req.params.tagId),
    )

    if (modelTagLink) {
      res.send(modelTagLink).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const deleteModelTagLink = (
  nnStore: NeuralNetworkStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const success = await nnStore.deleteModelTagLink(
      Number(req.params.modelId),
      Number(req.params.tagId),
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

const getTagsForModel = (
  nnStore: NeuralNetworkStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const tags = await nnStore.getTagsForModel(
      Number(req.params.modelId),
    )

    if (tags) {
      res.send(tags).end()
    } else {
      res.sendStatus(404).end()
    }
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const exportModel = (
  nnStore: NeuralNetworkStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const model = await nnStore.getModelById(
      Number(req.params.modelId),
    )

    if (model === null) {
      res.sendStatus(404).end()
      return
    }

    res.download(model.path)
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getModel = (
  nnStore: NeuralNetworkStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const model = await nnStore.getModelById(Number(req.params.id))

    if (model === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(model).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const deleteModel = (
  nnStore: NeuralNetworkStoreType,
  staticFileService: StaticFileServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const model = await nnStore.getModelById(Number(req.params.id))

    if (model === null) {
      res.sendStatus(404).end()
      return
    }

    await nnStore.deleteSelectedLabels(model.id)
    const success = await nnStore.deleteModelById(model.id)

    // Model might be used by streaming instance, in that case it can't be deleted
    if (success) {
      try {
        await staticFileService.deleteFile(model.path)
      } catch (e) {
        console.error(e)
      }
    } else {
      console.log('Model not deleted because of reference')
    }

    res.sendStatus(204).end()
    return
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const neuralNetworkRoute = (deps: Dependencies): RouterType => {
  const router = Router()
  const neuralNetworkStore = NeuralNetworkStore(deps)

  router.post(
    '/models/tags',
    checkToken(deps.authService, ['trainer']),
    insertModelTag(neuralNetworkStore),
  )
  router.get(
    '/models/tags',
    checkToken(deps.authService, ['trainer']),
    getModelTags(neuralNetworkStore),
  )
  router.get(
    '/',
    checkToken(deps.authService, ['trainer', 'deployer']),
    getNeuralNetworks(neuralNetworkStore),
  )
  router.get(
    '/:nnId/models',
    checkToken(deps.authService, ['trainer', 'deployer']),
    getModelsForNN(neuralNetworkStore),
  )
  router.post(
    '/:nnId/models',
    checkToken(deps.authService, ['trainer']),
    deps.staticFileService.uploadMiddleware,
    insertModel(neuralNetworkStore),
  )
  router.get(
    '/models',
    checkToken(deps.authService, ['trainer']),
    getAllModels(neuralNetworkStore),
  )
  router.get(
    '/models/:id',
    checkToken(deps.authService, ['trainer']),
    getModel(neuralNetworkStore),
  )
  router.patch(
    '/models/:id',
    checkToken(deps.authService, ['trainer']),
    updateModel(neuralNetworkStore),
  )
  router.delete(
    '/models/:id',
    checkToken(deps.authService, ['trainer']),
    deleteModel(neuralNetworkStore, deps.staticFileService),
  )
  router.get(
    '/models/:modelId/tags',
    checkToken(deps.authService, ['trainer']),
    getTagsForModel(neuralNetworkStore),
  )
  router.post(
    '/models/:modelId/tags/:tagId',
    checkToken(deps.authService, ['trainer']),
    insertModelTagLink(neuralNetworkStore),
  )
  router.delete(
    '/models/:modelId/tags/:tagId',
    checkToken(deps.authService, ['trainer']),
    deleteModelTagLink(neuralNetworkStore),
  )
  router.get(
    '/models/:modelId/export',
    checkToken(deps.authService, ['trainer']),
    exportModel(neuralNetworkStore),
  )

  return router
}

export default neuralNetworkRoute
