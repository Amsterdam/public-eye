import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const deleteBoundingBox = (
  frameId: number,
  boundingBoxId: number,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const ops = {
      method: 'DELETE',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    }

    await fetchAndDiscard(`${baseUrl}/frames/${frameId}/bounding_boxes/${boundingBoxId}?tk=${token}`, ops)
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete bounding box', 'error'))
    }
    return false
  }
}

export default deleteBoundingBox
