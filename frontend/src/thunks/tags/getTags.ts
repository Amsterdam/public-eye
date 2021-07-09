import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { FrameTag } from 'types'

const getTags = (
  frameId: number,
): AppThunk<Promise<FrameTag[] | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const result = await fetchJson(`${baseUrl}/frames/${frameId}/tags/?tk=${token}`)
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to retrieve tag', 'error'))
    }
    console.error(e)
    return null
  }
}

export default getTags
