import jwt from 'jsonwebtoken'
import {
  includes,
  intersection,
  length,
  pipe,
  split,
  last,
  filter,
} from 'ramda'
import { JwtConfig } from 'common/config'
import { Database } from 'db'
import { Job } from 'typescript-types'
import UserStore, { UserStoreType } from 'data/UserStore'

const SUPER_USER_NAME = 'admin'

type Token = {
  userId: number,
}

const createJwtForUser = (config: JwtConfig) => async (userId: number) => {
  const { secret } = config

  const payload = {
    userId,
  }

  return jwt.sign(payload, secret, {})
}

const decodeJwt = (config: JwtConfig) => async (token: string) => {
  const { secret } = config

  try {
    const decoded = jwt.verify(token, secret)
    return decoded as Token
  } catch (e) {
    console.error(e)
    return null
  }
}

const isSuperUser = (usersRoles: string[]) => includes(SUPER_USER_NAME)(usersRoles)

const verifyUserHasAuthorizedRole = (userStore: UserStoreType) => async (
  decodedToken: { userId: number },
  authorizedRoles: string[],
) => {
  const { userId } = decodedToken

  try {
    const userRoles = await userStore.getRolesByUserId(userId)
    if (!userRoles) {
      return false
    }
    const userRoleNames = userRoles.map(({ name }) => name)

    if (isSuperUser(userRoleNames)) {
      return true
    }

    const overlappingRoles = intersection(userRoleNames, authorizedRoles)

    // user has at least one of the roles that are authorized
    return length(overlappingRoles) > 0
  } catch (e) {
    console.error(e)
    return false
  }
}

const verifyUserHasAuthorizedRoleForJob = (
  userStore: UserStoreType,
  jobsAuthorization: Record<string, string[]>,
) => async (decodedToken: { userId: number }, jobScriptName: string) => {
  const { userId } = decodedToken

  try {
    const userRoles = await userStore.getRolesByUserId(userId)
    const userRoleNames = userRoles ? userRoles.map(({ name }) => name) : []
    if (isSuperUser(userRoleNames)) {
      return true
    }
    const authorizedRoles = jobsAuthorization[jobScriptName]

    if (!authorizedRoles) {
      return true
    }

    const overlappingRoles = intersection(userRoleNames, authorizedRoles)

    // user has at least one of the roles that are authorized
    return length(overlappingRoles) > 0
  } catch (e) {
    console.error(e)
    return false
  }
}

const filterJobs = (
  jobsAuthorization: Record<string, string[]>,
) => (jobs: Job[], userRoleNames: string[]): Job[] => {
  const filterFunc = (job: Job) => {
    if (includes(SUPER_USER_NAME)(userRoleNames)) {
      return true
    }
    const path = pipe(
      split('/'),
      last,
    )(job.job_script_path) as string

    const authorizedRoles = jobsAuthorization[path]
    // if module is not authorized via config.json every role can acces it
    if (authorizedRoles === undefined) {
      return true
    }

    const overlappingRoles = intersection(userRoleNames, authorizedRoles)

    return length(overlappingRoles) > 0
  }
  const filteredJobs = filter(filterFunc)(jobs)

  return filteredJobs
}

export type AuthServiceType = {
  filterJobs: ReturnType<typeof filterJobs>,
  verifyUserHasAuthorizedRole: ReturnType<typeof verifyUserHasAuthorizedRole>,
  createJwtForUser: ReturnType<typeof createJwtForUser>,
  decodeJwt: ReturnType<typeof decodeJwt>,
  verifyUserHasAuthorizedRoleForJob: ReturnType<typeof verifyUserHasAuthorizedRoleForJob>,
}

const AuthService = (
  config: { secret: string, authorization: Record<string, string[]> },
  db: Database,
): AuthServiceType => {
  const { secret, authorization } = config
  const userStore = UserStore({ db })

  if (secret == null) {
    throw new Error('invalid secret')
  }

  return {
    filterJobs: filterJobs(authorization),
    verifyUserHasAuthorizedRole: verifyUserHasAuthorizedRole(userStore),
    createJwtForUser: createJwtForUser({ secret }),
    decodeJwt: decodeJwt({ secret }),
    verifyUserHasAuthorizedRoleForJob: verifyUserHasAuthorizedRoleForJob(userStore, authorization),
  }
}

export default AuthService
