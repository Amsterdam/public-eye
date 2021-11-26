import { AuthServiceType } from 'services/AuthService'
import {
  Request,
  Response,
  NextFunction,
} from 'express'

// authorizedRoles should be array of the roles that should allow access
// if everyone should have access authorizedRoles should be null
export const checkToken = (
  authService: AuthServiceType,
  authorizedRoles: string[] | null = null,
) => async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.query.tk || req.headers['x-access-token']
  if (token == null) {
    res.sendStatus(401)
    return
  }

  const decodedToken = await authService.decodeJwt(token as string)
  if (decodedToken == null) {
    console.warn('invalid token for req: ', req.params, req.body)
    res.sendStatus(401)
    return
  }

  if (authorizedRoles !== null) {
    const authorized = await authService.verifyUserHasAuthorizedRole(decodedToken, authorizedRoles)
    if (!authorized) {
      console.warn('user is not authorized based on roles, token:', decodedToken)
      res.sendStatus(401)
      return
    }
  }

  next()
}

// to also verify the jobScriptName in case of a job route, the function
// retrieveJobScriptName should retrieve the job_script_name based on the request
// job_script_name is mapped to the roles that are authorized to access it
export const checkTokenJob = (
  authService: AuthServiceType,
  retrieveJobScriptName: (req: Request) => Promise<string | null>,
) => async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.query.tk || req.headers['x-access-token']
  if (token == null) {
    res.sendStatus(401)
    return
  }

  const decodedToken = await authService.decodeJwt(String(token))
  if (decodedToken == null) {
    console.warn('invalid token for req: ', req.params, req.body)
    res.sendStatus(401)
    return
  }

  const jobScriptName = await retrieveJobScriptName(req)

  const authorized = await authService.verifyUserHasAuthorizedRoleForJob(
    decodedToken,
    jobScriptName || '',
  )
  if (!authorized) {
    console.warn('user is not authorized based on roles, token:', decodedToken)
    res.sendStatus(401)
  }

  next()
}
