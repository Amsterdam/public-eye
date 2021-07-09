import {
  update,
} from 'ramda'

import { SET_FRAMES, SetFrames } from 'actions/navigator/setFrames'
import { UPDATE_NAVIGATOR_FRAME, UpdateNavigatorFrame } from 'actions/navigator/updateNavigatorFrame'
import { DELETE_NAVIGATOR_FRAME, DeleteNavigatorFrame } from 'actions/navigator/deleteNavigatorFrame'
import { RESET_STATE, ResetStateAction } from 'actions/general/resetState'
import { Frame } from 'types'

type NavigatorReducer = {
  frames: Frame[],
}

const defaultState: NavigatorReducer = {
  frames: [],
}

const updateNavigatorFrameAction = (
  state: NavigatorReducer, action: UpdateNavigatorFrame,
): NavigatorReducer => {
  const index = state.frames.findIndex(({ id }) => id === action.frame.id)

  if (index !== -1) {
    return {
      ...state,
      frames: update(index, { ...state.frames[index], ...action.frame })(state.frames),
    }
  }
  return state
}

const setFrames = (
  state: NavigatorReducer, action: SetFrames,
): NavigatorReducer => ({
  ...state,
  frames: action.frames,
})

const deleteNavigatorFrame = (
  state: NavigatorReducer, action: DeleteNavigatorFrame,
): NavigatorReducer => ({
  ...state,
  frames: state.frames.filter(({ id }) => id !== action.frameId),
})

type ReducerAction = (
  SetFrames
  | UpdateNavigatorFrame
  | DeleteNavigatorFrame
  | ResetStateAction
)

const reducer = (state = defaultState, action: ReducerAction): NavigatorReducer => {
  switch (action.type) {
    case RESET_STATE:
      return defaultState
    case SET_FRAMES:
      return setFrames(state, action as SetFrames)
    case UPDATE_NAVIGATOR_FRAME:
      return updateNavigatorFrameAction(state, action as UpdateNavigatorFrame)
    case DELETE_NAVIGATOR_FRAME:
      return deleteNavigatorFrame(state, action as DeleteNavigatorFrame)
    default:
      return state
  }
}

export default reducer
