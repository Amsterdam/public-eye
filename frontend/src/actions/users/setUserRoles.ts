import { UserRole } from 'types'

export const SET_USER_ROLES = 'SET_USER_ROLES'
export type SetUserRoles = {
  type: string,
  roles: UserRole[]
}

const setUserRoles = (roles: UserRole[]): SetUserRoles => ({
  type: SET_USER_ROLES,
  roles,
})

export default setUserRoles
