const Router = require('express-promise-router')
const { checkToken } = require('./AuthMiddleware')
const DeployStore = require('../data/DeployStore')
const JobStore = require('../data/JobStore')
const UserStore = require('../data/UserStore')

const getDeploys = (authService, userStore, deployStore) => async (req, res) => {
  try {
    const token = req.query.tk || req.headers['x-access-token']
    const { userId } = await authService.decodeJwt(token)
    const user = await userStore.getUserById(userId)
    const userRoleNames = user.roles.map(({ name }) => name)

    const items = userRoleNames.includes('admin')
      ? await deployStore.getDeploys(req.query.skip, req.query.limit)
      : await deployStore.getDeploysByUserId(userId, req.query.skip, req.query.limit)
  
    const count = userRoleNames.includes('admin')
      ? await deployStore.getTotalDeploysCount()
      : await deployStore.getTotalDeploysCountByUserId(userId)

    if (items === null || count === null) {
      return res.sendStatus(404).end()
    }

    res.send({ items: items, count }).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const deleteDeploy = (deployStore, jobStore) => async (req, res) => {
  try {
    const job = await jobStore.getJobById(req.params.id)

    if (job.job_script_path.includes('stream_multicapture.py')) {
      const multi = await deployStore.getMultiCaptureByJobId(req.params.id)
      if (multi) {
        await deployStore.deleteCamerasUsedInMulticaptureStream(multi.id)
      }
      await deployStore.deleteMultiCaptureByJobId(req.params.id)
    }

    await deployStore.deleteStreamInstanceByJobId(req.params.id)
    await jobStore.deleteJobById(req.params.id)

    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getDeployById = (deployStore) => async (req, res) => {
  try {
    const deploy = await deployStore.getDeployByJobId(req.params.id)

    if (deploy === null) {
      return res.sendStatus(404).end()
    }

    res.send(deploy).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

module.exports = (deps) => {

  const router = new Router()

  const deployStore = DeployStore(deps)
  const jobStore = JobStore(deps)
  const userStore = UserStore(deps)
  
  router.get(
    '/',
    checkToken(deps.authService, ['deployer']),
    getDeploys(deps.authService, userStore, deployStore)
  )
  router.get(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    getDeployById(deployStore)
  )
  router.delete(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    deleteDeploy(deployStore, jobStore)
  )

  return router
}
