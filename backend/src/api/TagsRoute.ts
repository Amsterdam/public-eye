import Router from 'express-promise-router'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import TagStore, { TagStoreType } from 'data/TagStore'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

const insertTags = (
  tagStore: TagStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await tagStore.insertTags(req.body)
    res.send(200).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const getTagsForFrameId = (
  tagStore: TagStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const tags = await tagStore.retrieveTagsForFrameId(
      Number(req.query.frameId),
    )

    if (tags === null) {
      res.send(404).end()
      return
    }

    res.send(tags)
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const TagsRoute = (deps: Dependencies): RouterType => {
  const router = Router()

  const tagStore = TagStore(deps)

  router.post(
    '/',
    checkToken(deps.authService, ['tagger']),
    insertTags(tagStore),
  )
  router.get(
    '/',
    checkToken(deps.authService, ['tagger']),
    getTagsForFrameId(tagStore),
  )
  return router
}

export default TagsRoute
