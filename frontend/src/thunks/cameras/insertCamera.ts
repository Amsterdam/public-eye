import setOrAddCamera from 'actions/cameras/setOrAddCamera'
import { batch } from 'react-redux'
import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { Camera } from 'types'
import { AppThunk } from 'store'

const insertCamera = (camera: Camera): AppThunk<void> => async (dispatch, getState) => {
  try {
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(camera),
    }
    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/cameras?tk=${token}`
    const result = await fetchJson(url, ops)
    batch(() => {
      dispatch(setOrAddCamera(result as Camera))
      dispatch(setInfo(true, 'Camera inserted'))
    })
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to insert cameras', 'error'))
    } else {
      dispatch(setInfo(true, 'Something went wrong, possibly a camera already exists with that stream url', 'error'))
    }
  }
}

export default insertCamera
