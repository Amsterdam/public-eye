import { Camera } from 'types'

export const SET_OR_ADD_CAMERA = 'SET_OR_ADD_CAMERA'
export type SetOrAddCamera = {
  type: string,
  camera: Camera,
}

const setOrAddCamera = (camera: Camera): SetOrAddCamera => ({
  type: SET_OR_ADD_CAMERA,
  camera,
})

export default setOrAddCamera
