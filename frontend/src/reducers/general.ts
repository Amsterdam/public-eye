import { SET_INFO, SetInfo } from 'actions/general/setInfo'
import { SET_USER_ROLES, SetUserRoles } from 'actions/users/setUserRoles'
import { RESET_STATE, ResetStateAction } from 'actions/general/resetState'

import {
  UserRole,
} from 'types'

type GeneralReducer = {
  baseUrl: string,
  websocketUrl: string,
  info: {
    open: boolean,
    severity: string,
    message: string,
  },
  userAuth: {
    roles: UserRole[],
  },
}

const defaultState: GeneralReducer = {
  baseUrl: process.env.REACT_APP_HOST_LOCATION || `${window.location.origin}/api`,
  websocketUrl: process.env.REACT_APP_WEBSOCKET_LOCATION || window.location.origin,
  info: {
    open: false,
    severity: 'info',
    message: '',
  },
  userAuth: {
    roles: [],
  },
}

type ReducerAction = (
  | SetInfo
  | SetUserRoles
  | ResetStateAction
)

const setUserRoles = (state: GeneralReducer, action: SetUserRoles) => ({
  ...state,
  userAuth: {
    roles: action.roles,
  },
})

const setInfo = (state: GeneralReducer, action: SetInfo) => ({
  ...state,
  info: {
    open: action.open,
    message: action.message,
    severity: action.severity,
  },
})

const reducer = (state = defaultState, action: ReducerAction): GeneralReducer => {
  switch (action.type) {
    case RESET_STATE:
      return defaultState
    case SET_USER_ROLES:
      return setUserRoles(state, action as SetUserRoles)
    case SET_INFO:
      return setInfo(state, action as SetInfo)
    default:
      return state
  }
}

export default reducer
