import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { LoiPolygon, StreamLoi } from 'types'
import { AppThunk } from 'store'

const submitLoi = (
  cameraId: number,
  polygons: LoiPolygon,
  name: string,
): AppThunk<Promise<StreamLoi>> => async (dispatch, getState) => {
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
    const result = await fetchJson(`${baseUrl}/cameras/${cameraId}/loi?tk=${token}`, ops)
    dispatch(setInfo(true, 'Succesfully inserted line of interest'))
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to submit line of interest', 'error'))
    }
    console.error(e)
    return null
  }
}

export default submitLoi
