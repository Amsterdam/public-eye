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

const getAllMultiCaptures = (
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
      ? await streamInstanceStore.getAllMultiCaptures()
      : await streamInstanceStore.getAllMultiCapturesByUserId(userId)

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

const deleteMultiCapture = (
  streamInstanceStore: StreamInstanceStoreType,
  jobStore: JobStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const multiCapture = await streamInstanceStore.getMultiCaptureById(
      Number(req.params.id),
    )
    if (!multiCapture) {
      res.send(404).end()
      return
    }
    await streamInstanceStore.deleteCamerasUsedInMulticaptureStream(
      Number(req.params.id),
    )
    await streamInstanceStore.deleteMultiCaptureById(
      Number(req.params.id),
    )
    await jobStore.deleteJobById(multiCapture.running_job_id)

    res.send(202).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const multiCaptureRoute = (deps: Dependencies): RouterType => {
  const router = Router()
  const streamInstanceStore = StreamInstanceStore(deps)
  const jobStore = JobStore(deps)
  const userStore = UserStore(deps)

  router.get(
    '/',
    checkToken(deps.authService, ['deployer']),
    getAllMultiCaptures(deps.authService, streamInstanceStore, userStore),
  )
  router.delete(
    '/:id',
    checkToken(deps.authService, ['deployer']),
    deleteMultiCapture(streamInstanceStore, jobStore),
  )
  return router
}

export default multiCaptureRoute
