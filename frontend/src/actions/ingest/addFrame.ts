import { Frame } from 'types'

export const ADD_FRAME = 'ADD_FRAME'
export type AddFrame = {
  type: string,
  id: number,
  newFrame: Frame,
}

const addFrame = (id: number, newFrame: Frame): AddFrame => ({
  type: ADD_FRAME,
  id,
  newFrame,
})

export default addFrame
