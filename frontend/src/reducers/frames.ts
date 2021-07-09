// intended as cache for frames to be used in frameviewer
import { Frame } from 'types'
import { SET_OR_ADD_FRAME, SetOrAddFrame } from 'actions/frames/setOrAddFrame'

type FrameReducer = Record<number, Frame>

const defaultState: FrameReducer = {}

type ReducerAction = SetOrAddFrame

const reducer = (
  state = defaultState, action: ReducerAction,
): FrameReducer => {
  switch (action.type) {
    case SET_OR_ADD_FRAME:
      return {
        ...state,
        [action.frame.id]: action.frame,
      }
    default:
      return state
  }
}

export default reducer
