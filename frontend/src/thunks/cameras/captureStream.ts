import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { StreamCapture } from 'types'

const captureStream = (
  cameraId: number,
): AppThunk<Promise<StreamCapture | null>> => async (dispatch, getState) => {
  try {
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    }
    const token = getToken()
    const { baseUrl } = getState().general
    const result = await fetchJson(`${baseUrl}/cameras/${cameraId}/stream_capture?tk=${token}`, ops)
    return result
  } catch (e) {
    console.error(e)
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to capture stream', 'error'))
    } else {
      dispatch(setInfo(true, 'Capturing stream failed.', 'error'))
    }
    return null
  }
}

export default captureStream
