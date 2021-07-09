const Router = require('express-promise-router')
const { checkToken } = require('./AuthMiddleware')
const TagStore = require('../data/TagStore')

const insertTags = (tagStore) => async (req, res) => {
  try {
    await tagStore.insertTags(req.body)
    res.send(200).end()
  } catch (e) {
    console.error(e)
    return res.send(500).end()
  }
}

const getTagsForFrameId = (tagStore) => async (req, res) => {
  try {
    const tags = await tagStore.retrieveTagsForFrameId(req.query.frameId)

    if (tags === null) {
      return res.send(404).end()
    }
  
    res.send(tags)
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

module.exports = (deps) => {

  const router = new Router()

  const tagStore = TagStore(deps)
    
  router.post(
    '/',
    checkToken(deps.authService, ['tagger']),
    insertTags(tagStore)
  )
  router.get(
    '/',
    checkToken(deps.authService, ['tagger']),
    getTagsForFrameId(tagStore)
  )
  return router
}
