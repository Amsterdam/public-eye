export const SET_USER_ROLES = 'SET_USER_ROLES'
export type SetUserRoles = {
  type: string,
  roles: string[]
}

const setUserRoles = (roles: string[]): SetUserRoles => ({
  type: SET_USER_ROLES,
  roles,
})

export default setUserRoles
