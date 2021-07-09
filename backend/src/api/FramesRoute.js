const assert = require('assert')

const Router = require('express-promise-router')
const LabelStore = require('../data/LabelStore')
const { checkToken } = require('./AuthMiddleware')
const TagStore = require('../data/TagStore')
const FrameStore = require('../data/FrameStore')
const BoundingBoxStore = require('../data/BoundingBoxStore')
const DatasetStore = require('../data/DatasetStore')

const getTagsForFrameId = (tagStore) => async (req, res) => {
  try {
    const tags = await tagStore.retrieveTagsForFrameId(req.params.frameId)

    if (tags === null) {
      return res.sendStatus(404).end()
    }
    res.send(tags).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const insertTag = (tagStore) => async (req, res) => {
  try {
    const tag = await tagStore.insertTag(req.params.frameId, req.body)

    if (tag === null) {
      return res.sendStatus(500).end()
    }
    res.send(tag).end()
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const deleteTag = (tagStore) => async (req, res) => {
  try {
    await tagStore.deleteTag(req.params.tagId)
    res.sendStatus(200).end()
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const updateTag = (tagStore) => async (req, res) => {
  try {
    const result = await tagStore.updateTag(req.params.tagId, req.body.x, req.body.y)
  
    if (result === null) {
      return res.sendStatus(404).end()
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const updateFrame = (frameStore, staticFileService) => async (req, res) => {
  try {
    const frame = await frameStore.getFrameById(req.params.frameId)

    // path changed so have to rename on filesystem
    if (frame.path !== req.body.path) {
      await staticFileService.renameFile(frame.path, req.body.path)
    }

    const result = await frameStore.updateFrame(req.params.frameId, req.body)

    if (result === null) {
      return res.sendStatus(404).end()
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getLabels = (labelStore) => async (req, res) => {
  try {
    const result = await labelStore.getLabels()

    if (result === null) {
      return res.sendStatus(404).end()
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const insertLabel = (labelStore) => async (req, res) => {
  try {
    const result = await labelStore.insertLabel(req.body.name, req.body.rgb)

    if (result === null) {
      return res.sendStatus(404).end()
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const insertBoundingbox = (boundingBoxStore) => async (req, res) => {
  try {
    const result = await boundingBoxStore.insertBoundingBox(req.body)

    if (result === null) {
      return res.sendStatus(404).end()
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getBoundingBoxes = (boundingBoxStore) => async (req, res) => {
  try {
    const result = await boundingBoxStore.getBoundingBoxesByFrameId(req.params.frameId)

    if (result === null) {
      return res.sendStatus(404).end()
    }

    res.send(result).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const deleteBoundingBox = (boundingBoxStore) => async (req, res) => {
  try {
    await boundingBoxStore.deleteBoundingBox(req.params.boundingBoxId)

    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const updateBoundingBoxLabel = (boundingBoxStore) => async (req, res) => {
  try {
    const boundingBox = await boundingBoxStore.updateBoundingBoxLabel(req.params.boundingBoxId, req.params.labelId)

    res.send(boundingBox).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const deleteFrame = (staticFileService, frameStore, tagStore, boundingBoxStore, datasetStore) => async (req, res) => {
  try {
    const datasetIds = await datasetStore.getDatasetIdsForFrameId(req.params.frameId)
    if (datasetIds.length > 0) {
      // frame can only be deleted if is not in a dataset
      res.sendStatus(409).send("Frame cannot be deleted if it is part of a dataset.")
      return
    }

    const frame = await frameStore.getFrameById(req.params.frameId)
    await staticFileService.deleteFile(frame.path)
    await boundingBoxStore.deleteBoundingBoxesByFrameId(req.params.frameId)
    await tagStore.deleteTagsByFrameId(req.params.frameId)
    await frameStore.deleteFrameFromCollections(req.params.frameId)
    await frameStore.deleteFrameById(req.params.frameId)

    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getFrameById = (frameStore) => async (req, res) => {
  try {
    const frame = await frameStore.getFrameById(req.params.frameId)

    if (frame === null) {
      res.sendStatus(404).end()
    }

    res.send(frame).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

module.exports = (deps) => {

  const router = new Router()

  const tagStore = TagStore(deps)
  const frameStore = FrameStore(deps)
  const labelStore = LabelStore(deps)
  const boundingBoxStore = BoundingBoxStore(deps)
  const datasetStore = DatasetStore(deps)
  
  router.get(
    '/:frameId',
    checkToken(deps.authService, ['tagger']),
    getFrameById(frameStore)
  )
  router.post(
    '/:frameId/tags/',
    checkToken(deps.authService, ['tagger']),
    insertTag(tagStore)
  )
  router.get(
    '/:frameId/tags/',
    checkToken(deps.authService, ['tagger']),
    getTagsForFrameId(tagStore)
  )
  router.delete(
    '/:frameId/tags/:tagId',
    checkToken(deps.authService, ['tagger']),
    deleteTag(tagStore)
  )
  router.put(
    '/:frameId/tags/:tagId',
    checkToken(deps.authService, ['tagger']),
    updateTag(tagStore)
  )
  router.put(
    '/:frameId',
    checkToken(deps.authService, ['tagger']),
    updateFrame(frameStore, deps.staticFileService)
  )
  router.delete(
    '/:frameId',
    checkToken(deps.authService, ['tagger']),
    deleteFrame(deps.staticFileService, frameStore, tagStore, boundingBoxStore, datasetStore)
  )
  router.get(
    '/bounding_boxes/labels',
    checkToken(deps.authService, ['tagger']),
    getLabels(labelStore)
  )
  router.post(
    '/bounding_boxes/labels',
    checkToken(deps.authService, ['tagger']),
    insertLabel(labelStore)
  )
  router.post(
    '/bounding_boxes',
    checkToken(deps.authService, ['tagger']),
    insertBoundingbox(boundingBoxStore)
  )
  router.get(
    '/:frameId/bounding_boxes',
    checkToken(deps.authService, ['tagger']),
    getBoundingBoxes(boundingBoxStore)
  )
  router.put(
    '/:frameId/bounding_boxes/:boundingBoxId/labels/:labelId',
    checkToken(deps.authService, ['tagger']),
    updateBoundingBoxLabel(boundingBoxStore)
  )
  router.delete(
    '/:frameId/bounding_boxes/:boundingBoxId',
    checkToken(deps.authService, ['tagger']),
    deleteBoundingBox(boundingBoxStore)
  )
  return router
}
