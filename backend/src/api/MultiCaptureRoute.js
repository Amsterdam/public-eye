const StreamInstanceStore = require('../data/StreamInstanceStore')
const JobStore = require('../data/JobStore')
const UserStore = require('../data/UserStore')
const Router = require('express-promise-router')
const { checkToken } = require('./AuthMiddleware')


const getAllMultiCaptures = (
  authService,
  streamInstanceStore,
  userStore,
) => async (req, res) => {
  try {
    const token = req.query.tk || req.headers['x-access-token']
    const { userId } = await authService.decodeJwt(token)
    const user = await userStore.getUserById(userId)
    const userRoleNames = user.roles.map(({ name }) => name)

    const result = userRoleNames.includes('admin')
      ? await streamInstanceStore.getAllMultiCaptures()
      : await streamInstanceStore.getAllMultiCapturesByUserId(userId)

    if (result === null) {
      return res.send(404).end()
    }
  
    res.send(result)
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const deleteMultiCapture = (streamInstanceStore, jobStore) => async (req, res) => {
  try {
    const multiCapture = await streamInstanceStore.getMultiCaptureById(req.params.id)
    await streamInstanceStore.deleteCamerasUsedInMulticaptureStream(req.params.id)
    await streamInstanceStore.deleteMultiCaptureById(req.params.id)
    await jobStore.deleteJobById(multiCapture.running_job_id)

    res.send(202).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}


module.exports = (deps) => {

  const router = new Router()
  const streamInstanceStore = StreamInstanceStore(deps)
  const jobStore = JobStore(deps)
  const userStore = UserStore(deps)

  router.get(
    '/',
    checkToken(deps.authService, ['deployer']),
    getAllMultiCaptures(deps.authService, streamInstanceStore, userStore)
  )
  router.delete(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    deleteMultiCapture(streamInstanceStore, jobStore)
  )
  return router
}

