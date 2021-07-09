const Router = require('express-promise-router')

const { checkToken } = require('./AuthMiddleware')

const echoWebsocketMessage = () => async (req, res) =>{
  try {
    req.app.get('io').emit(req.params.route, req.body)

    res.send(200).end()
  } catch (e) {
    console.error(e)
    res.send(500).end()
  }
}

module.exports = (deps) => {
  const authService = deps.authService

  const router = new Router()

  router.post('/echo/:route', checkToken(authService), echoWebsocketMessage())

  return router
}
