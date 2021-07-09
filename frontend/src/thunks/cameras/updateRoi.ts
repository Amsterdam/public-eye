import { getToken, fetchJson } from 'utils'
import setInfo from 'actions/setInfo'

const updateRoi = (cameraId, roiId, roi) => async (dispatch, getState) => {
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
    if (e.status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get cameras', 'error'))
    }
  }
}

export default updateRoi