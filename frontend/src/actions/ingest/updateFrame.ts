import { Frame } from 'types'

export const UPDATE_FRAME = 'UPDATE_FRAME'
export type UpdateFrame = {
  type: string,
  frame: Frame,
  itemId: number,
  itemType: string,
  func: (x: number | string) => string,
}

const updateFrame = (
  frame: Frame, itemId: number, itemType: string, func: (x: number | string) => string,
): UpdateFrame => ({
  type: UPDATE_FRAME,
  frame,
  itemId,
  itemType,
  func,
})

export default updateFrame
