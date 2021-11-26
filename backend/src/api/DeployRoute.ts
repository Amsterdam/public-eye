import Router from 'express-promise-router'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import DeployStore, { DeployStoreType } from 'data/DeployStore'
import JobStore, { JobStoreType } from 'data/JobStore'
import UserStore, { UserStoreType } from 'data/UserStore'
import { AuthServiceType } from 'services/AuthService'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

const getDeploys = (
  authService: AuthServiceType,
  userStore: UserStoreType,
  deployStore: DeployStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const token = req.query.tk || req.headers['x-access-token']
    const decodedToken = await authService.decodeJwt(String(token))
    if (!decodedToken) {
      res.send(401).end()
      return
    }

    const { userId } = decodedToken
    const user = await userStore.getUserById(userId)
    const userRoleNames = user
      ? user.roles.map(({ name }) => name)
      : []

    const items = userRoleNames.includes('admin')
      ? await deployStore.getDeploys(
        req.query.skip ? Number(req.query.skip) : undefined,
        req.query.limit ? Number(req.query.limit) : undefined,
      ) : await deployStore.getDeploysByUserId(
        userId,
        req.query.skip ? Number(req.query.skip) : undefined,
        req.query.limit ? Number(req.query.limit): undefined,
      )

    const count = userRoleNames.includes('admin')
      ? await deployStore.getTotalDeploysCount()
      : await deployStore.getTotalDeploysCountByUserId(userId)

    if (items === null || count === null) {
      res.sendStatus(404).end()
      return
    }

    res.send({ items, count }).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const deleteDeploy = (
  deployStore: DeployStoreType,
  jobStore: JobStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const job = await jobStore.getJobById(Number(req.params.id))
    if (!job) {
      res.send(404).end()
      return
    }

    if (job.job_script_path.includes('stream_multicapture.py')) {
      const multi = await deployStore.getMultiCaptureByJobId(
        Number(req.params.id),
      )
      if (multi) {
        await deployStore.deleteCamerasUsedInMulticaptureStream(multi.id)
      }
      await deployStore.deleteMultiCaptureByJobId(
        Number(req.params.id),
      )
    }

    await deployStore.deleteStreamInstanceByJobId(
      Number(req.params.id),
    )
    await jobStore.deleteJobById(Number(req.params.id))

    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getDeployById = (deployStore: DeployStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const deploy = await deployStore.getDeployByJobId(
      Number(req.params.id),
    )

    if (deploy === null) {
      res.sendStatus(404).end()
      return
    }

    res.send(deploy).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const DeployRoute = (deps: Dependencies): RouterType => {
  const router = Router()

  const deployStore = DeployStore(deps)
  const jobStore = JobStore(deps)
  const userStore = UserStore(deps)

  router.get(
    '/',
    checkToken(deps.authService, ['deployer']),
    getDeploys(deps.authService, userStore, deployStore),
  )
  router.get(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    getDeployById(deployStore),
  )
  router.delete(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    deleteDeploy(deployStore, jobStore),
  )

  return router
}

export default DeployRoute
