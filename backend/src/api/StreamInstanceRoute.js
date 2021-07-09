const StreamInstanceStore = require('../data/StreamInstanceStore')
const JobStore = require('../data/JobStore')
const UserStore = require('../data/UserStore')
const Router = require('express-promise-router')
const { checkToken } = require('./AuthMiddleware')


const getAllStreamInstances = (
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
      ? await streamInstanceStore.getAllStreamInstances()
      : await streamInstanceStore.getAllStreamInstancesByUserId(userId)

    if (result === null) {
      return res.send(404).end()
    }
  
    res.send(result)
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const deleteStreamInstance = (streamInstancesStore, jobStore) => async (req, res) => {
  try {
    const streamInstance = await streamInstancesStore.getStreamInstanceById(req.params.id)
    await streamInstancesStore.deleteStreamInstanceById(req.params.id)
    if (streamInstance.running_job_id) {
      await jobStore.deleteJobById(streamInstance.running_job_id)
    }

    res.send(204).end()
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
    getAllStreamInstances(deps.authService, streamInstanceStore, userStore)
  )
  router.delete(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    deleteStreamInstance(streamInstanceStore, jobStore)
  )
  return router
}

