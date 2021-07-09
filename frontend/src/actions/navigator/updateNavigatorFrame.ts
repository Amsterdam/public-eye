import { Frame } from 'types'

export const UPDATE_NAVIGATOR_FRAME = 'UPDATE_NAVIGATOR_FRAME'
export type UpdateNavigatorFrame = {
  type: string,
  frame: Frame,
}

const updateNavigatorFrame = (frame: Frame): UpdateNavigatorFrame => ({
  type: UPDATE_NAVIGATOR_FRAME,
  frame,
})

export default updateNavigatorFrame
