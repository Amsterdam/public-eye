import Router from 'express-promise-router'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import TagStore, { TagStoreType } from 'data/TagStore'
import FrameStore, { FrameStoreType } from 'data/FrameStore'
import LabelStore, { LabelStoreType } from 'data/LabelStore'
import BoundingBoxStore, { BoundingBoxStoreType } from 'data/BoundingBoxStore'
import DatasetStore, { DatasetStoreType } from 'data/DatasetStore'
import { StaticFileServiceType } from 'services/StaticFileService'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

const getTagsForFrameId = (tagStore: TagStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const tags = await tagStore.retrieveTagsForFrameId(
      Number(req.params.frameId),
    )

    if (tags === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(tags).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const insertTag = (tagStore: TagStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const tag = await tagStore.insertTag(
      Number(req.params.frameId),
      req.body,
    )

    if (tag === null) {
      res.sendStatus(500).end()
      return
    }

    res.send(tag).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const deleteTag = (tagStore: TagStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await tagStore.deleteTag(Number(req.params.tagId))
    res.sendStatus(200).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

type UpdateTagBody = {
  x: number,
  y: number,
}

const updateTag = (tagStore: TagStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await tagStore.updateTag(
      Number(req.params.tagId),
      (req.body as UpdateTagBody).x,
      (req.body as UpdateTagBody).y,
    )

    if (result === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

type UpdateFrameBody = {
  path: string,
}

const updateFrame = (
  frameStore: FrameStoreType,
  staticFileService: StaticFileServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const frame = await frameStore.getFrameById(
      Number(req.params.frameId),
    )

    // path changed so have to rename on filesystem
    if (frame && frame.path !== (req.body as UpdateFrameBody).path) {
      await staticFileService.renameFile(
        frame.path,
        (req.body as UpdateFrameBody).path,
      )
    }

    const result = await frameStore.updateFrame(
      Number(req.params.frameId),
      req.body,
    )

    if (result === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getLabels = (labelStore: LabelStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await labelStore.getLabels()

    if (result === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

type InsertLabelBody = {
  name: string,
  rgb: string,
}

const insertLabel = (labelStore: LabelStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await labelStore.insertLabel(
      (req.body as InsertLabelBody).name,
      (req.body as InsertLabelBody).rgb,
    )

    if (result === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const insertBoundingbox = (
  boundingBoxStore: BoundingBoxStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await boundingBoxStore.insertBoundingBox(req.body)

    if (result === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getBoundingBoxes = (
  boundingBoxStore: BoundingBoxStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await boundingBoxStore.getBoundingBoxesByFrameId(
      Number(req.params.frameId),
    )

    if (result === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const deleteBoundingBox = (
  boundingBoxStore: BoundingBoxStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await boundingBoxStore.deleteBoundingBox(
      Number(req.params.boundingBoxId),
    )

    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const updateBoundingBoxLabel = (
  boundingBoxStore: BoundingBoxStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const boundingBox = await boundingBoxStore.updateBoundingBoxLabel(
      Number(req.params.boundingBoxId),
      Number(req.params.labelId),
    )

    res.send(boundingBox).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const deleteFrame = (
  staticFileService: StaticFileServiceType,
  frameStore: FrameStoreType,
  tagStore: TagStoreType,
  boundingBoxStore: BoundingBoxStoreType,
  datasetStore: DatasetStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const datasetIds = await datasetStore.getDatasetIdsForFrameId(
      Number(req.params.frameId),
    )
    if (datasetIds && datasetIds.length > 0) {
      // frame can only be deleted if is not in a dataset
      res.sendStatus(409).send('Frame cannot be deleted if it is part of a dataset.')
      return
    }

    const frame = await frameStore.getFrameById(
      Number(req.params.frameId),
    )

    if (frame) {
      await staticFileService.deleteFile(frame.path)
    }

    await boundingBoxStore.deleteBoundingBoxesByFrameId(req.params.frameId)
    await tagStore.deleteTagsByFrameId(Number(req.params.frameId))
    await frameStore.deleteFrameFromCollections(Number(req.params.frameId))
    await frameStore.deleteFrameById(Number(req.params.frameId))

    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getFrameById = (frameStore: FrameStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const frame = await frameStore.getFrameById(
      Number(req.params.frameId),
    )

    if (frame === null) {
      res.sendStatus(404).end()
    }

    res.send(frame).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const FramesRoute = (deps: Dependencies): RouterType => {
  const router = Router()

  const tagStore = TagStore(deps)
  const frameStore = FrameStore(deps)
  const labelStore = LabelStore(deps)
  const boundingBoxStore = BoundingBoxStore(deps)
  const datasetStore = DatasetStore(deps)

  router.get(
    '/:frameId',
    checkToken(deps.authService, ['tagger']),
    getFrameById(frameStore),
  )
  router.post(
    '/:frameId/tags/',
    checkToken(deps.authService, ['tagger']),
    insertTag(tagStore),
  )
  router.get(
    '/:frameId/tags/',
    checkToken(deps.authService, ['tagger']),
    getTagsForFrameId(tagStore),
  )
  router.delete(
    '/:frameId/tags/:tagId',
    checkToken(deps.authService, ['tagger']),
    deleteTag(tagStore),
  )
  router.put(
    '/:frameId/tags/:tagId',
    checkToken(deps.authService, ['tagger']),
    updateTag(tagStore),
  )
  router.put(
    '/:frameId',
    checkToken(deps.authService, ['tagger']),
    updateFrame(frameStore, deps.staticFileService),
  )
  router.delete(
    '/:frameId',
    checkToken(deps.authService, ['tagger']),
    deleteFrame(deps.staticFileService, frameStore, tagStore, boundingBoxStore, datasetStore),
  )
  router.get(
    '/bounding_boxes/labels',
    checkToken(deps.authService, ['tagger']),
    getLabels(labelStore),
  )
  router.post(
    '/bounding_boxes/labels',
    checkToken(deps.authService, ['tagger']),
    insertLabel(labelStore),
  )
  router.post(
    '/bounding_boxes',
    checkToken(deps.authService, ['tagger']),
    insertBoundingbox(boundingBoxStore),
  )
  router.get(
    '/:frameId/bounding_boxes',
    checkToken(deps.authService, ['tagger']),
    getBoundingBoxes(boundingBoxStore),
  )
  router.put(
    '/:frameId/bounding_boxes/:boundingBoxId/labels/:labelId',
    checkToken(deps.authService, ['tagger']),
    updateBoundingBoxLabel(boundingBoxStore),
  )
  router.delete(
    '/:frameId/bounding_boxes/:boundingBoxId',
    checkToken(deps.authService, ['tagger']),
    deleteBoundingBox(boundingBoxStore),
  )
  return router
}

export default FramesRoute
