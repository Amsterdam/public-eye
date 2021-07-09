import { User } from 'types'

export const SET_ALL_USERS = 'SET_ALL_USERS'

export type SetAllUsersAction = {
  type: string,
  users: User[],
}

const setAllUsers = (users: User[]): SetAllUsersAction => ({
  type: SET_ALL_USERS,
  users,
})

export default setAllUsers
