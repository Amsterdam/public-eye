import { User } from 'types'

export const ADD_USER = 'ADD_USER'

export type AddUserAction = {
  type: string,
  user: User
}

const addUser = (user: User): AddUserAction => ({
  type: ADD_USER,
  user,
})

export default addUser
