import { User } from 'types'

export const EDIT_USER = 'EDIT_USER'

export type EditUserAction = {
  type: string,
  user: User
}

const editUser = (user: User): EditUserAction => ({
  type: EDIT_USER,
  user,
})

export default editUser
