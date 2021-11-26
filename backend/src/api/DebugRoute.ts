import Router from 'express-promise-router'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

const printRequest = () => async (
  req: Request,
  res: Response,
): Promise<void> => {
  console.log('request:', req.params.param, req.body)

  res.send(200).end()
}

const DebugRoute = (deps: Dependencies): RouterType => {
  const router = Router()

  router.post('/:param', checkToken(deps.authService, ['deployer']), printRequest())

  return router
}

export default DebugRoute
