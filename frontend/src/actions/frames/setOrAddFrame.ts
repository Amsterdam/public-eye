import { Frame } from 'types'

export const SET_OR_ADD_FRAME = 'SET_OR_ADD_FRAME'

export type SetOrAddFrame = {
  type: string,
  frame: Frame,
}

const setOrAddFrame = (frame: Frame): SetOrAddFrame => ({
  type: SET_OR_ADD_FRAME,
  frame,
})

export default setOrAddFrame
