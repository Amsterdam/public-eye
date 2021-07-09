const jwt = require('jsonwebtoken')
const R = require('ramda')
const UserStore = require('../data/UserStore')

const SUPER_USER_NAME = 'admin'

const createJwtForUser = (config) => async (userId) => {
  const secret = config.secret

  const payload = {
    userId,
  }

  return await jwt.sign(payload, secret, {})
}

const decodeJwt = (config) => async (token) => {
  const secret = config.secret

  try {
    const decoded = await jwt.verify(token, secret)
    return decoded
  } catch (e) {
    console.error(e)
    return null
  }
}

const isSuperUser = (usersRoles) => R.includes(SUPER_USER_NAME)(usersRoles)

const verifyUserHasAuthorizedRole = (userStore) => async (decodedToken, authorizedRoles) => {
  const userId = decodedToken.userId

  try {
    const userRoles = await userStore.getRolesByUserId(userId)
    const userRoleNames = userRoles.map(({ name }) => name)
    if (isSuperUser(userRoleNames)) {
      return true
    }

    const overlappingRoles = R.intersection(userRoleNames, authorizedRoles)

    // user has at least one of the roles that are authorized
    return R.length(overlappingRoles) > 0
  } catch (e) {
    console.error(e)
    return false
  }
}

const verifyUserHasAuthorizedRoleForJob = (userStore, jobsAuthorization) => async (decodedToken, jobScriptName) => {
  const userId = decodedToken.userId

  try {
    const userRoles = await userStore.getRolesByUserId(userId)
    const userRoleNames = userRoles.map(({ name }) => name)
    if (isSuperUser(userRoleNames)) {
      return true
    }
    const authorizedRoles = jobsAuthorization[jobScriptName]

    if (!authorizedRoles) {
      return true
    }
  
    const overlappingRoles = R.intersection(userRoleNames, authorizedRoles)

    // user has at least one of the roles that are authorized
    return R.length(overlappingRoles) > 0
  } catch (e) {
    console.error(e)
    return false
  }
}

const filterJobs = (jobsAuthorization) => (jobs, userRoleNames) => {
  const filterFunc = (job) => {
    if (R.includes(SUPER_USER_NAME)(userRoleNames)) {
      return true
    }
    const path = R.pipe(
      R.split('/'),
      R.last
    )(job.job_script_path)

    const authorizedRoles = jobsAuthorization[path]
    // if module is not authorized via config.json every role can acces it
    if (authorizedRoles === undefined) {
      return true
    }

    const overlappingRoles = R.intersection(userRoleNames, authorizedRoles)

    return R.length(overlappingRoles) > 0
  }
  const filteredJobs = R.filter(filterFunc)(jobs)

  return filteredJobs
}


const AuthService = (config, db) => {
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
    verifyUserHasAuthorizedRoleForJob: verifyUserHasAuthorizedRoleForJob(userStore, authorization)
  }
}

module.exports = AuthService
