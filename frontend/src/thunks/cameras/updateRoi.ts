import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { StreamRoi } from 'types'

const updateRoi = (
  cameraId: number,
  roiId: number,
  roi: StreamRoi,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
  try {
    const ops = {
      method: 'PUT',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(roi),
    }
    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/cameras/${cameraId}/roi/${roiId}?tk=${token}`
    const result = await fetchJson(url, ops)
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get cameras', 'error'))
    }
    return null
  }
}

export default updateRoi
