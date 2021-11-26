import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const updateTag = (
  tagId: number,
  frameId: number,
  x: number,
  y: number,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
  try {
    const body = JSON.stringify({ x, y })
    const ops = {
      method: 'PUT',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body,
    }

    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/frames/${frameId}/tags/${tagId}?tk=${token}`
    const json = await fetchJson(url, ops)
    return json
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to update tag', 'error'))
    }
    return null
  }
}

export default updateTag
