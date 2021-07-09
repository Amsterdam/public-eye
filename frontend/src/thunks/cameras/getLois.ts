import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { StreamLoi } from 'types'

const getLois = (
  cameraId: number,
): AppThunk<Promise<StreamLoi | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const result = await fetchJson(`${baseUrl}/cameras/${cameraId}/loi?tk=${token}`)
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get region of interests', 'error'))
    }
    return null
  }
}

export default getLois
