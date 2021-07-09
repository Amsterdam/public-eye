// authorizedRoles should be array of the roles that should allow access
// if everyone should have access authorizedRoles should be null
const checkToken = (authService, authorizedRoles = null) => async (req, res, next) => {

  const token = req.query.tk || req.headers['x-access-token']
  if (token == null) {
    return res.sendStatus(401)
  }

  const decodedToken = await authService.decodeJwt(token)
  if (decodedToken == null) {
    console.warn('invalid token for res: ', res.params, res.body)
    return res.sendStatus(401)
  }

  if (authorizedRoles !== null) {
    const authorized = await authService.verifyUserHasAuthorizedRole(decodedToken, authorizedRoles)
    if (!authorized) {
      console.warn('user is not authorized based on roles, token:', decodedToken)
      return res.sendStatus(401)
    }
  }

  next()
}

// to also verify the jobScriptName in case of a job route, the function 
// retrieveJobScriptName should retrieve the job_script_name based on the request
// job_script_name is mapped to the roles that are authorized to access it
const checkTokenJob = (authService, retrieveJobScriptName) => async (req, res, next) => {

  const token = req.query.tk || req.headers['x-access-token']
  if (token == null) {
    return res.sendStatus(401);
  }

  const decodedToken = await authService.decodeJwt(token)
  if (decodedToken == null) {
    console.warn('invalid token for res: ', res.params, res.body)
    return res.sendStatus(401)
  }

  const jobScriptName = await retrieveJobScriptName(req)
  const authorized = await authService.verifyUserHasAuthorizedRoleForJob(decodedToken, jobScriptName)
  if (!authorized) {
    console.warn('user is not authorized based on roles, token:', decodedToken)
    return res.sendStatus(401)
  }

  next()
}

module.exports = {
  checkToken,
  checkTokenJob,
}
