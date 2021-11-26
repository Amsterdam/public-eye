import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const deleteModelTagLink = (
  modelId: number,
  modelTagId: number,
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

    await fetchAndDiscard(`${baseUrl}/neural_networks/models/${modelId}/tags/${modelTagId}?tk=${token}`, ops)
    dispatch(setInfo(true, 'Model tag deleted'))
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to insert model tag link', 'error'))
    }
    return false
  }
}

export default deleteModelTagLink
