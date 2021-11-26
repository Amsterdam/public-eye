import Router from 'express-promise-router'
import {
  pipe,
  split,
  last,
  update,
  join,
} from 'ramda'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import fs from 'fs'
import JSZip from 'jszip'
import CollectionStore, { CollectionStoreType } from 'data/CollectionsStore'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

type InsertCollectionBody = {
  collectionName: string,
}

const insertCollection = (
  collectionStore: CollectionStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const collection = await collectionStore.insertCollection(
    (req.body as InsertCollectionBody).collectionName,
  )
  if (collection === null) {
    res.sendStatus(500).end()
  }
  res.send(collection).end()
}

const fetchAllCollections = (
  collectionFileStore: CollectionStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const collections = await collectionFileStore.getAllCollections(
    Number(req.query.skip),
    Number(req.query.limit),
    req.query.filter && String(req.query.filter),
  )
  const collectionCount = await collectionFileStore.getTotalCollectionCount(
    req.query.filter && String(req.query.filter),
  )

  if (collections === null || collectionCount === null) {
    res.sendStatus(404).end()
    return
  }

  res.send({ items: collections, count: collectionCount }).end()
}

const fetchFramesForCollectionId = (
  collectionStore: CollectionStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const frames = await collectionStore.getFramesForCollectionId(
      Number(req.params.collectionId),
      Number(req.query.skip),
      Number(req.query.limit),
    )

    if (frames === null) {
      res.send(404).end()
      return
    }

    res.send(frames).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

type InsertFramesBody = {
  frameIds: number[],
}

const insertFrames = (
  collectionStore: CollectionStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await collectionStore.addFramesToCollection(
      Number(req.params.collectionId),
      (req.body as InsertFramesBody).frameIds,
    )
    res.send(result).end()
  } catch (e) {
    res.sendStatus(500).end()
    console.error(e)
  }
}

const exportCollectionDensity = (
  collectionStore: CollectionStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const collection = await collectionStore.getCollectionById(
      Number(req.params.collectionId),
    )

    if (collection === null) {
      res.send(404).end()
      return
    }

    const frames = await collectionStore.getFramesForCollectionIdWithTags(
      Number(req.params.collectionId),
    ) || []

    const zip = new JSZip()
    frames.forEach(async ({ points, path }) => {
      const fileName = pipe(
        split('/'),
        last,
      )(path) as string

      // image
      const imageStream = fs.createReadStream(path)
      zip.file(fileName, imageStream)

      // tags
      const tagsFilename = pipe(
        split('.'),
        update(-1, '-tags.csv'),
        join(''),
      )(fileName)
      zip.file(tagsFilename, `x,y,\n${points.join('\n')}`)
    })

    const stream = zip.generateNodeStream()
    res.attachment(`${collection.name}-density_export.zip`)
    stream.pipe(res)
  } catch (e) {
    res.sendStatus(500).end()
    console.error(e)
  }
}

const exportCollectionObject = (
  collectionStore: CollectionStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const collection = await collectionStore.getCollectionById(
      Number(req.params.collectionId),
    )
    if (collection === null) {
      res.send(404).end()
      return
    }

    const frames = await collectionStore.getFramesForCollectionIdWithBboxes(
      Number(req.params.collectionId),
    ) || []

    const zip = new JSZip()
    frames.forEach(async ({ boxes, path }) => {
      const fileName = pipe(
        split('/'),
        last,
      )(path) as string

      // image
      const imageStream = fs.createReadStream(path)
      zip.file(fileName, imageStream)

      // tags
      const boundingBoxesFileName = pipe(
        split('.'),
        update(-1, '-bounding_boxes.csv'),
        join(''),
      )(fileName)
      zip.file(boundingBoxesFileName, `x,y,w,h,class\n${boxes.join('\n')}`)
    })

    const stream = zip.generateNodeStream()
    res.attachment(`${collection.name}-object_export.zip`)
    stream.pipe(res)
  } catch (e) {
    res.sendStatus(500).end()
    console.error(e)
  }
}

const getClosestPage = (
  collectionFileStore: CollectionStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = await collectionFileStore.getClosestPage(
      Number(req.params.collectionId),
      Number(req.query.timestamp),
      Number(req.query.limit),
    )

    res.send({ page }).end()
  } catch (e) {
    res.sendStatus(500).end()
    console.error(e)
  }
}

const fetchCollectionById = (
  collectionStore: CollectionStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const collection = await collectionStore.getCollectionById(
      Number(req.params.id),
    )

    if (collection === null) {
      res.sendStatus(404).end()
    }

    res.send(collection).end()
  } catch (e) {
    res.sendStatus(500).end()
    console.error(e)
  }
}

const CollectionsRoute = (deps: Dependencies): RouterType => {
  const router = Router()

  const collectionStore = CollectionStore(deps)

  router.post(
    '/',
    checkToken(deps.authService, ['tagger']),
    insertCollection(collectionStore),
  )
  router.get(
    '/',
    checkToken(deps.authService, ['tagger']),
    fetchAllCollections(collectionStore),
  )
  router.get(
    '/:id',
    checkToken(deps.authService, ['tagger']),
    fetchCollectionById(collectionStore),
  )
  router.get(
    '/:collectionId/frames',
    checkToken(deps.authService, ['tagger']),
    fetchFramesForCollectionId(collectionStore),
  )
  router.post(
    '/:collectionId/frames',
    checkToken(deps.authService, ['tagger']),
    insertFrames(collectionStore),
  )
  router.get(
    '/:collectionId/export_density',
    checkToken(deps.authService, ['trainer']),
    exportCollectionDensity(collectionStore),
  )
  router.get(
    '/:collectionId/export_object',
    checkToken(deps.authService, ['trainer']),
    exportCollectionObject(collectionStore),
  )
  router.get(
    '/:collectionId/frames/closest_page',
    checkToken(deps.authService, ['tagger']),
    getClosestPage(collectionStore),
  )
  return router
}

export default CollectionsRoute
