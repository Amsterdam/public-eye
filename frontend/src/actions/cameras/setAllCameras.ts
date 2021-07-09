import { Camera } from 'types'

export const SET_ALL_CAMERAS = 'SET_ALL_CAMERAS'
export type SetAllCamera = {
  type: string,
  cameras: Camera[],
}

const setAllCameras = (cameras: Camera[]): SetAllCamera => ({
  type: SET_ALL_CAMERAS,
  cameras,
})

export default setAllCameras
