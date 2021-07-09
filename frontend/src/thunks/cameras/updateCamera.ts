import setOrAddCamera from 'actions/cameras/setOrAddCamera'
import { batch } from 'react-redux'
import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { Camera } from 'types'
import { AppThunk } from 'store'

const updateCamera = (
  id: number,
  camera: Camera,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const ops = {
      method: 'PUT',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(camera),
    }
    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/cameras/${id}?tk=${token}`
    const result = await fetchJson(url, ops)
    batch(() => {
      dispatch(setOrAddCamera(result))
      dispatch(setInfo(true, 'Camera updated'))
    })
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get cameras', 'error'))
    } else {
      dispatch(setInfo(true, 'Something went wrong, possibly a camera already exists with that stream url', 'error'))
    }
  }
}

export default updateCamera
