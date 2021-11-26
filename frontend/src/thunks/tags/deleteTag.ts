import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const deleteFrame = (
  frameId: number,
  tagId: number,
): AppThunk<Promise<boolean | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const ops = {
      method: 'DELETE',
    }

    const url = `${baseUrl}/frames/${frameId}/tags/${tagId}?tk=${token}`
    await fetchAndDiscard(url, ops)
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete tag"', 'error'))
    }
    return null
  }
}

export default deleteFrame
