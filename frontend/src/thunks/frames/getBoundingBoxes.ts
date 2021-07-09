import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { BoundingBox } from 'types'

const getBoundingBoxes = (
  frameId: number,
): AppThunk<Promise<BoundingBox[] | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const json = await fetchJson(`${baseUrl}/frames/${frameId}/bounding_boxes/?tk=${token}`)
    return json
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to fetch bounding boxes', 'error'))
    }
    return null
  }
}

export default getBoundingBoxes
