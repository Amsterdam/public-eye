import Router from 'express-promise-router'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import StreamInstanceStore, { StreamInstanceStoreType } from 'data/StreamInstanceStore'
import JobStore, { JobStoreType } from 'data/JobStore'
import UserStore, { UserStoreType } from 'data/UserStore'
import { AuthServiceType } from 'services/AuthService'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

const getAllStreamInstances = (
  authService: AuthServiceType,
  streamInstanceStore: StreamInstanceStoreType,
  userStore: UserStoreType,
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

    const result = userRoleNames.includes('admin')
      ? await streamInstanceStore.getAllStreamInstances()
      : await streamInstanceStore.getAllStreamInstancesByUserId(
        Number(userId),
      )

    if (result === null) {
      res.send(404).end()
      return
    }

    res.send(result)
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const deleteStreamInstance = (
  streamInstancesStore: StreamInstanceStoreType,
  jobStore: JobStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const streamInstance = await streamInstancesStore.getStreamInstanceById(
      Number(req.params.id),
    )

    if (!streamInstance) {
      res.send(404).end()
      return
    }

    await streamInstancesStore.deleteStreamInstanceById(
      Number(req.params.id),
    )
    if (streamInstance.running_job_id) {
      await jobStore.deleteJobById(streamInstance.running_job_id)
    }

    res.send(204).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const StreamInstanceRoute = (deps: Dependencies): RouterType => {
  const router = Router()
  const streamInstanceStore = StreamInstanceStore(deps)
  const jobStore = JobStore(deps)
  const userStore = UserStore(deps)

  router.get(
    '/',
    checkToken(deps.authService, ['deployer']),
    getAllStreamInstances(deps.authService, streamInstanceStore, userStore),
  )
  router.delete(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    deleteStreamInstance(streamInstanceStore, jobStore),
  )
  return router
}

export default StreamInstanceRoute
