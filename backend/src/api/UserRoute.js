const Router = require('express-promise-router')
const UserStore = require('../data/UserStore')
const { checkToken } = require('./AuthMiddleware')

const getById = (userStore) => async (req, res) => {
  const { id } = req.params

	const user = await userStore.getUserById(id)

  res.send(user)
}

const getAuthToken = (userStore, authService) => async (req, res) => {
  // password is plaintext here.
  const { email, password } = req.body

  console.log('Auth request for: ', email)

  if (await userStore.validatePasswordForEmail(email, password)) {
    const user = await userStore.getUserByEmail(email)
    
    const token = await authService.createJwtForUser(user.id)

    res.send({token}).end()
  } else {
    res.sendStatus(401)
  }
}

const newUser = (userStore, saltRounds) => async (req, res) => {
  try {
    // password is plaintext here.
    const { email, password } = req.body

    const user = await userStore.newUser(email, saltRounds, password)

    if (user) {
      res.send(user).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    res.sendStatus(500).end()
  }
}

const getAllUsers = (userStore) => async (req, res) => {
  try {
    const users = await userStore.getAllUsers( )

    res.send(users).end()
  } catch (e) {
    res.sendStatus(500).end()
  }
}

const deleteUser = (userStore) => async (req, res) => {
  try {
    await userStore.deleteUserRolesByUserId(req.params.id)
    const success = await userStore.deleteUser(req.params.id)

    if (success) {
      res.sendStatus(204).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    res.sendStatus(500).end()
  }
}

const editUser = (userStore, saltRounds) => async (req, res) => {
  try {
    // password is plaintext here.
    const { email, password } = req.body
    const currentUserRecord = await userStore.getUserById(req.params.id)

    // email changed
    if (email && email !== currentUserRecord.email) {
      await userStore.editEmail(req.params.id, email)
    }
  
    if (password) {
      await userStore.changePassword(req.params.id, password, saltRounds)
    }

    const updatedUser = await userStore.getUserById(req.params.id)
    res.send(updatedUser).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getAllRoles = (userStore) => async (req, res) => {
  try {
    const roles = await userStore.getAllRoles()

    res.send(roles).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const newUserRole = (userStore) => async (req, res) => {
  try {
    const success = await userStore.insertUserRole(req.params.user_id, req.params.role_id)
    
    if (success) {
      res.sendStatus(201).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const deleteUserRole = (userStore) => async (req, res) => {
  try {
    const success = await userStore.deleteUserRole(req.params.user_id, req.params.role_id)

    if (success) {
      res.sendStatus(204).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getUserByToken = (authService, userStore) => async (req, res) => {
  try {
    const token = req.query.tk || req.headers['x-access-token']
    if (token == null) {
      return res.sendStatus(401)
    }
  
    const decodedToken = await authService.decodeJwt(token)
    if (decodedToken == null) {
      console.warn('invalid token for res: ', res.params, res.body)
      return res.sendStatus(401)
    }

    const { userId } = decodedToken
    const user = await userStore.getUserById(userId)
    const userWithUnpackedRoles = {
      ...user,
      roles: user.roles.map(({ name }) => name),
    }

    res.send(userWithUnpackedRoles).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const editEmail = (userStore) => async (req, res) => {
  try {
    const { email, currentPassword } = req.body

    const authorized = await userStore.validatePasswordForId(req.params.id, currentPassword)
    if (!authorized) {
      return res.sendStatus(401).end()
    }

    await userStore.editEmail(req.params.id, email)
    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const editPassword  = (userStore, saltRounds) => async (req, res) => {
  try {
    const { newPassword, currentPassword } = req.body

    const authorized = await userStore.validatePasswordForId(req.params.id, currentPassword)
    if (!authorized) {
      return res.sendStatus(401).end()
    }

    await userStore.changePassword(req.params.id, newPassword, saltRounds)
    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

module.exports = (deps) => {
  const userStore = UserStore({
    db: deps.db,
  })

  const authService = deps.authService

  const router = new Router()

  router.post('/auth', getAuthToken(userStore, authService))

  router.get(
    '/roles',
    checkToken(authService, authorizedRoles=['admin']),
    getAllRoles(userStore))
  router.post(
    '/:user_id/roles/:role_id',
    checkToken(authService, authorizedRoles=['admin']),
    newUserRole(userStore))
  router.delete(
    '/:user_id/roles/:role_id',
    checkToken(authService, authorizedRoles=['admin']),
    deleteUserRole(userStore))

  router.get(
    '/user_by_token',
    checkToken(authService),
    getUserByToken(authService, userStore)
  )
  router.post(
    '/',
    checkToken(authService, authorizedRoles=['admin']),
    newUser(userStore, deps.password.saltRounds))
  router.get(
    '/',
    checkToken(authService, authorizedRoles=['admin']),
    getAllUsers(userStore))
  router.get('/:id', checkToken(authService), getById(userStore))

  router.delete(
    '/:id',
    checkToken(authService, authorizedRoles=['admin']),
    deleteUser(userStore))
  router.patch(
    '/:id',
    checkToken(authService, authorizedRoles=['admin']),
    editUser(userStore, deps.password.saltRounds))
  router.patch(
    '/:id/email',
    checkToken(authService),
    editEmail(userStore)
  )
  router.patch(
    '/:id/password',
    checkToken(authService),
    editPassword(userStore, deps.password.saltRounds)
  )

  return router
}
