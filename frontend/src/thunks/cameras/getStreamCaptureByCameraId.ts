import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { StreamCapture } from 'types'

const getStreamCaptureByCameraId = (
  id: number,
): AppThunk<Promise<StreamCapture | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/cameras/${id}/stream_capture?tk=${token}`
    const result = await fetchJson(url)
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get stream capture', 'error'))
    }
    return null
  }
}

export default getStreamCaptureByCameraId
