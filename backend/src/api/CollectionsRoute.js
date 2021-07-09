const Router = require('express-promise-router')
const R = require('ramda')
const { checkToken } = require('./AuthMiddleware')
const CollectionStore = require('../data/CollectionStore')
const fs = require('fs')
const JSZip = require('jszip')

const insertCollection = (collectionStore) => async (req, res) => {
  const collection = await collectionStore.insertCollection(req.body.collectionName)
  if (collection === null) {
    res.sendStatus(500).end()
  }
  res.send(collection).end()
}

const fetchAllCollections = (collectionFileStore) => async (req, res) => {
  const collections = await collectionFileStore.getAllCollections(req.query.skip, req.query.limit, req.query.filter)
  const collectionCount = await collectionFileStore.getTotalCollectionCount(req.query.filter)

  if (collections === null || collectionCount === null) {
    return res.sendStatus(404).end()
  }

  res.send({ items: collections, count: collectionCount }).end()
}

const fetchFramesForCollectionId = (collectionStore) => async (req, res) => {
  try {
    const frames = await collectionStore.getFramesForCollectionId(req.params.collectionId, req.query.skip, req.query.limit)

    if (frames === null) {
      return res.send(404).end()
    }

    return res.send(frames).end()
  } catch (e) {
    console.error(e)
    return res.sendStatus(500).end()
  }
}

const insertFrames = (collectionStore) => async (req, res) => {
  try {
    const result = await collectionStore.addFramesToCollection(req.params.collectionId, req.body.frameIds)
    res.send(result).end()
  } catch (e) {
    res.sendStatus(500).end()
    console.error(e)
  }
}

const exportCollectionDensity = (collectionStore) => async (req, res) => {
  try {
    const collection = await collectionStore.getCollectionById(req.params.collectionId)
    if (collection === null) {
      return res.send(404).end()
    }

    const frames = await collectionStore.getFramesForCollectionIdWithTags(req.params.collectionId)

    const zip = new JSZip()
    frames.forEach(async ({ points, path }) => {
      const fileName = R.pipe(
        R.split('/'),
        R.last,
      )(path)

      // image
      const imageStream = fs.createReadStream(path)
      zip.file(fileName, imageStream)

      // tags
      const tagsFilename = R.pipe(
        R.split('.'),
        R.update(-1, '-tags.csv'),
        R.join("")
      )(fileName)
      zip.file(tagsFilename, 'x,y,\n' + points.join('\n'))
    })

    const stream = zip.generateNodeStream()
    res.attachment(`${collection.name}-density_export.zip`)
    stream.pipe(res)
  } catch (e) {
    res.sendStatus(500).end()
    console.error(e)
  }
}

const exportCollectionObject = (collectionStore) => async (req, res) => {
  try {
    const collection = await collectionStore.getCollectionById(req.params.collectionId)
    if (collection === null) {
      return res.send(404).end()
    }

    const frames = await collectionStore.getFramesForCollectionIdWithBboxes(req.params.collectionId)

    const zip = new JSZip()
    frames.forEach(async ({ boxes, path }) => {
      const fileName = R.pipe(
        R.split('/'),
        R.last,
      )(path)

      // image
      const imageStream = fs.createReadStream(path)
      zip.file(fileName, imageStream)

      // tags
      const boundingBoxesFileName = R.pipe(
        R.split('.'),
        R.update(-1, '-bounding_boxes.csv'),
        R.join("")
      )(fileName)
      zip.file(boundingBoxesFileName, 'x,y,w,h,class\n' + boxes.join('\n'))
    })

    const stream = zip.generateNodeStream()
    res.attachment(`${collection.name}-object_export.zip`)
    stream.pipe(res)
  } catch (e) {
    res.sendStatus(500).end()
    console.error(e)
  }
}

const getClosestPage = (collectionFileStore) => async (req, res) => {
  try {
    const page = await collectionFileStore.getClosestPage(
      req.params.collectionId, req.query.timestamp, req.query.limit)

    res.send({ page }).end()
  } catch (e) {
    res.sendStatus(500).end()
    console.error(e)
  }
}

const fetchCollectionById = (collectionStore) => async (req, res) => {
  try {
    const collection = await collectionStore.getCollectionById(req.params.id)

    if (collection === null) {
      res.sendStatus(404).end()
    }

    res.send(collection).end()
  } catch (e) {
    res.sendStatus(500).end()
    console.error(e)
  }
}

module.exports = (deps) => {
  const router = new Router()

  const collectionStore = CollectionStore(deps)

  router.post(
    '/',
    checkToken(deps.authService, ['tagger']),
    insertCollection(collectionStore)
  )
  router.get(
    '/',
    checkToken(deps.authService, ['tagger']),
    fetchAllCollections(collectionStore)
  )
  router.get(
    '/:id',
    checkToken(deps.authService, ['tagger']),
    fetchCollectionById(collectionStore)
  )
  router.get(
    '/:collectionId/frames',
    checkToken(deps.authService, ['tagger']),
    fetchFramesForCollectionId(collectionStore)
  )
  router.post(
    '/:collectionId/frames',
    checkToken(deps.authService, ['tagger']),
    insertFrames(collectionStore)
  )
  router.get(
    '/:collectionId/export_density',
    checkToken(deps.authService, ['trainer']),
    exportCollectionDensity(collectionStore)
  )
  router.get(
    '/:collectionId/export_object',
    checkToken(deps.authService, ['trainer']),
    exportCollectionObject(collectionStore)
  )
  router.get(
    '/:collectionId/frames/closest_page',
    checkToken(deps.authService, ['tagger']),
    getClosestPage(collectionStore)
  )
  return router
}
