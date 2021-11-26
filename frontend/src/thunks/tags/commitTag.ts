import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const commitTag = (
  frameId: number,
  x: number,
  y: number,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
  try {
    const body = JSON.stringify({
      x,
      y,
    })
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body,
    }

    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/frames/${frameId}/tags/?tk=${token}`
    const json = await fetchJson(url, ops)
    return json
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to commit tag"', 'error'))
    }
    return null
  }
}

export default commitTag
