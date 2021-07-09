import { SET_ALL_CAMERAS, SetAllCamera } from 'actions/cameras/setAllCameras'
import { SET_OR_ADD_CAMERA, SetOrAddCamera } from 'actions/cameras/setOrAddCamera'
import { DELETE_CAMERA, DeleteCamera } from 'actions/cameras/deleteCamera'
import { Camera } from 'types'

type CameraReducer = Map<number, Camera>

const defaultState: CameraReducer = new Map<number, Camera>()

const setAllCamerasAction = (
  state: CameraReducer, action: SetAllCamera,
): CameraReducer => {
  const newCameras = new Map<number, Camera>()
  action.cameras.forEach((camera: Camera) => {
    newCameras.set(camera.id, camera)
  })
  return newCameras
}

const setOrAddCamera = (
  state: CameraReducer, action: SetOrAddCamera,
): CameraReducer => (
  new Map(state.set(action.camera.id, action.camera))
)

const deleteCamera = (
  state: CameraReducer, action: DeleteCamera,
): CameraReducer => {
  state.delete(action.id)

  return new Map(state)
}

type ReducerAction = (
  SetAllCamera
  | SetOrAddCamera
  | DeleteCamera
)

const reducer = (
  state = defaultState, action: ReducerAction,
): Map<number, Camera> => {
  switch (action.type) {
    case SET_ALL_CAMERAS:
      return setAllCamerasAction(state, action as SetAllCamera)
    case SET_OR_ADD_CAMERA:
      return setOrAddCamera(state, action as SetOrAddCamera)
    case DELETE_CAMERA:
      return deleteCamera(state, action as DeleteCamera)
    default:
      return state
  }
}

export default reducer
