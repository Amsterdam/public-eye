import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { ObjectLabel } from 'types'

const insertLabel = (
  name: string,
  rgb: string,
): AppThunk<Promise<ObjectLabel | null>> => async (dispatch, getState) => {
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
        name,
        rgb,
      }),
    }

    const json = await fetchJson(`${baseUrl}/frames/bounding_boxes/labels?tk=${token}`, ops)
    return json
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to insert bounding box label', 'error'))
    }
    return null
  }
}

export default insertLabel
