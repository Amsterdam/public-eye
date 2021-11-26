import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const insertBoundingBox = (
  frameId: number,
  labelId: number,
  x: number,
  y: number,
  w: number,
  h: number,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        frameId,
        labelId,
        x,
        y,
        w,
        h,
      }),
    }

    const json = await fetchJson(`${baseUrl}/frames/bounding_boxes?tk=${token}`, ops)
    return json
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to insert bounding box', 'error'))
    }
    return null
  }
}

export default insertBoundingBox
