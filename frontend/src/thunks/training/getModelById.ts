import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const getModelById = (
  id: number,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const result = await fetchJson(`${baseUrl}/neural_networks/models/${id}?tk=${token}`)
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get model', 'error'))
    }
    return null
  }
}

export default getModelById
