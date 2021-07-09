const Router = require('express-promise-router')
const { checkToken } = require('./AuthMiddleware')

const printRequest = () => async (req, res) => {
  console.log('request:', req.params.param, req.body)

  res.send(200).end()
}

module.exports = (deps) => {

  const router = new Router()

  router.post('/:param', checkToken(deps.authService, ['deployer']), printRequest())

  return router
}
