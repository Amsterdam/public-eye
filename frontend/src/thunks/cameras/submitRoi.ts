import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { RoiPolygon } from 'types'
import { AppThunk } from 'store'

const submitRoi = (
  cameraId: number,
  polygons: RoiPolygon,
  name: string,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
  try {
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        name,
        polygons,
      }),
    }

    const token = getToken()
    const { baseUrl } = getState().general
    const result = await fetchJson(`${baseUrl}/cameras/${cameraId}/roi?tk=${token}`, ops)
    dispatch(setInfo(true, 'Succesfully inserted region of interest'))
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to submit region of interest', 'error'))
    }
    return null
  }
}

export default submitRoi
