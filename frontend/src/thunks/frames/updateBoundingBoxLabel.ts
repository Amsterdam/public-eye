import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { ObjectLabel } from 'types'

const updateBoundingBoxLabel = (
  frameId: number,
  boundingBoxId: number,
  labelId: number,
): AppThunk<Promise<ObjectLabel | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const ops = {
      method: 'PUT',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    }

    const json = await fetchJson(`${baseUrl}/frames/${frameId}/bounding_boxes/${boundingBoxId}/labels/${labelId}?tk=${token}`, ops)
    return json
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to update bounding box label', 'error'))
    }
    return null
  }
}

export default updateBoundingBoxLabel
