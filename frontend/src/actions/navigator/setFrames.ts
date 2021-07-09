import { Frame } from 'types'

export const SET_FRAMES = 'SET_FRAMES'
export type SetFrames = { type: 'video' | 'collection', frames: Frame[] }

const setFrames = (frames: Frame[]): SetFrames => ({
  type: SET_FRAMES,
  frames,
})

export default setFrames
