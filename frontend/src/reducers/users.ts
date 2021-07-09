import {
  findIndex,
  update,
  filter,
  append,
} from 'ramda'
import { SET_ALL_USERS, SetAllUsersAction } from 'actions/users/setAllUsers'
import { ADD_USER, AddUserAction } from 'actions/users/addUser'
import { DELETE_USER, DeleteUserAction } from 'actions/users/deleteUser'
import { EDIT_USER, EditUserAction } from 'actions/users/editUser'
import { RESET_STATE, ResetStateAction } from 'actions/general/resetState'
import { User } from 'types'

const defaultState: User[] = []

const editUserAction = (state: User[], action: { type: string, user: User }) => {
  const index = findIndex(({ id }) => id === action.user.id)(state)

  if (index === -1) {
    return state
  }

  return update(index, action.user)(state)
}

type ReducerAction = (
  SetAllUsersAction
  | AddUserAction
  | DeleteUserAction
  | EditUserAction
  | ResetStateAction
)

const setAllUser = (action: SetAllUsersAction) => action.users

const reducer = (state = defaultState, action: ReducerAction): User[] => {
  switch (action.type) {
    case RESET_STATE:
      return defaultState
    case SET_ALL_USERS:
      return setAllUser(action)
    case ADD_USER:
      return append(action.user)(state)
    case DELETE_USER:
      return filter(({ id }) => action.userId !== id, state)
    case EDIT_USER:
      return editUserAction(state, action)
    default:
      return state
  }
}

export default reducer
