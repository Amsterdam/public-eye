import Router from 'express-promise-router'
import {
  Request,
  Response,
  Router as RouterType,
} from 'express'
import UserStore, { UserStoreType } from 'data/UserStore'
import { AuthServiceType } from 'services/AuthService'
import { Dependencies } from 'common/dependencies'
import { checkToken } from './AuthMiddleware'

const getById = (userStore: UserStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params

  const user = await userStore.getUserById(Number(id))

  res.send(user)
}

const getAuthToken = (
  userStore: UserStoreType,
  authService: AuthServiceType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  // password is plaintext here.
  const { email, password } = req.body as { email: string, password: string }

  console.log('Auth request for: ', email)

  if (await userStore.validatePasswordForEmail(email, password)) {
    const user = await userStore.getUserByEmail(email)

    if (user) {
      const token = await authService.createJwtForUser(user.id)

      res.send({ token }).end()
    } else {
      res.send(404).end()
    }
  } else {
    res.sendStatus(401)
  }
}

const newUser = (
  userStore: UserStoreType,
  saltRounds: number,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // password is plaintext here.
    const { email, password } = req.body as { email: string, password: string }

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

const getAllUsers = (userStore: UserStoreType) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await userStore.getAllUsers()

    res.send(users).end()
  } catch (e) {
    res.sendStatus(500).end()
  }
}

const deleteUser = (
  userStore: UserStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await userStore.deleteUserRolesByUserId(Number(req.params.id))
    const success = await userStore.deleteUser(Number(req.params.id))

    if (success) {
      res.sendStatus(204).end()
    } else {
      res.sendStatus(500).end()
    }
  } catch (e) {
    res.sendStatus(500).end()
  }
}

const editUser = (
  userStore: UserStoreType,
  saltRounds: number,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // password is plaintext here.
    const { email, password } = req.body as { email: string, password: string }
    const currentUserRecord = await userStore.getUserById(Number(req.params.id))

    // email changed
    if (email && currentUserRecord && email !== currentUserRecord.email) {
      await userStore.editEmail(
        Number(req.params.id),
        email,
      )
    }

    if (password) {
      await userStore.changePassword(
        Number(req.params.id),
        password,
        saltRounds,
      )
    }

    const updatedUser = await userStore.getUserById(Number(req.params.id))
    res.send(updatedUser).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const getAllRoles = (
  userStore: UserStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const roles = await userStore.getAllRoles()

    res.send(roles).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const newUserRole = (
  userStore: UserStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const success = await userStore.insertUserRole(
      Number(req.params.user_id),
      Number(req.params.role_id),
    )

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

const deleteUserRole = (
  userStore: UserStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const success = await userStore.deleteUserRole(
      Number(req.params.user_id),
      Number(req.params.role_id),
    )

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

const getUserByToken = (
  authService: AuthServiceType,
  userStore: UserStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const token = req.query.tk || req.headers['x-access-token']
    if (token == null) {
      res.sendStatus(401)
      return
    }

    const decodedToken = await authService.decodeJwt(token as string)
    if (decodedToken == null) {
      console.warn('invalid token for res: ', req.params, req.body)
      res.sendStatus(401)
      return
    }

    const { userId } = decodedToken
    const user = await userStore.getUserById(userId)
    const userWithUnpackedRoles = {
      ...user,
      roles: user && user.roles.map(({ name }) => name),
    }

    res.send(userWithUnpackedRoles).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const editEmail = (
  userStore: UserStoreType,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, currentPassword } = req.body as { email: string, currentPassword: string }

    const authorized = await userStore.validatePasswordForId(
      Number(req.params.id),
      currentPassword,
    )
    if (!authorized) {
      res.sendStatus(401).end()
      return
    }

    await userStore.editEmail(
      Number(req.params.id),
      email,
    )
    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const editPassword = (
  userStore: UserStoreType,
  saltRounds: number,
) => async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      newPassword,
      currentPassword,
    } = req.body as { newPassword: string, currentPassword: string }

    const authorized = await userStore.validatePasswordForId(
      Number(req.params.id),
      currentPassword,
    )
    if (!authorized) {
      res.sendStatus(401).end()
      return
    }

    await userStore.changePassword(
      Number(req.params.id),
      newPassword,
      saltRounds,
    )
    res.sendStatus(204).end()
  } catch (e) {
    console.error(e)
    res.sendStatus(500).end()
  }
}

const UserRoute = (deps: Dependencies): RouterType => {
  const userStore = UserStore({
    db: deps.db,
  })

  const { authService } = deps

  const router = Router()

  router.post('/auth', getAuthToken(userStore, authService))

  router.get(
    '/roles',
    checkToken(authService, ['admin']),
    getAllRoles(userStore),
  )
  router.post(
    '/:user_id/roles/:role_id',
    checkToken(authService, ['admin']),
    newUserRole(userStore),
  )
  router.delete(
    '/:user_id/roles/:role_id',
    checkToken(authService, ['admin']),
    deleteUserRole(userStore),
  )

  router.get(
    '/user_by_token',
    checkToken(authService),
    getUserByToken(authService, userStore),
  )
  router.post(
    '/',
    checkToken(authService, ['admin']),
    newUser(userStore, deps.password.saltRounds),
  )
  router.get(
    '/',
    checkToken(authService, ['admin']),
    getAllUsers(userStore),
  )
  router.get('/:id', checkToken(authService), getById(userStore))

  router.delete(
    '/:id',
    checkToken(authService, ['admin']),
    deleteUser(userStore),
  )
  router.patch(
    '/:id',
    checkToken(authService, ['admin']),
    editUser(userStore, deps.password.saltRounds),
  )
  router.patch(
    '/:id/email',
    checkToken(authService),
    editEmail(userStore),
  )
  router.patch(
    '/:id/password',
    checkToken(authService),
    editPassword(userStore, deps.password.saltRounds),
  )

  return router
}

export default UserRoute
