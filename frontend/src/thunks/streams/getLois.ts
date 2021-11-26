import { getToken, fetchJson } from 'utils'
import { AppThunk } from 'store'

const getRois = (
  id: number,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const result = await fetchJson(`${baseUrl}/stream_capture/${id}/loi?tk=${token}`)
    return result
  } catch (e) {
    return null
  }
}

export default getRois
