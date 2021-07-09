import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { MultiCapture } from 'types'
import { AppThunk } from 'store'

const getMultiCapturesByCameraId = (
  id: number,
): AppThunk<Promise<MultiCapture[] | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/cameras/${id}/multicapture_stream?tk=${token}`
    const result = await fetchJson(url)
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get multicaptures', 'error'))
    }
    return null
  }
}

export default getMultiCapturesByCameraId
