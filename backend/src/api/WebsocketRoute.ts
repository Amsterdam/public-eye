import Router from 'express-promise-router'
import { Server } from 'socket.io'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

const echoWebsocketMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const io = req.app.get('io') as Server
    io.emit(req.params.route, req.body)

    res.send(200).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

const WebsocketRoute = (
  deps: Dependencies,
): RouterType => {
  const { authService } = deps

  const router = Router()

  router.post(
    '/echo/:route',
    checkToken(authService),
    echoWebsocketMessage,
  )

  return router
}

export default WebsocketRoute
