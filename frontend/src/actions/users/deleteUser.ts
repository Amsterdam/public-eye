export const DELETE_USER = 'DELETE_USER'

export type DeleteUserAction = {
  type: string,
  userId: number,
}

const deleteUser = (userId: number): DeleteUserAction => ({
  type: DELETE_USER,
  userId,
})

export default deleteUser
