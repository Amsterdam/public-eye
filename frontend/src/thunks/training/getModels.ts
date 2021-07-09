import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { Model } from 'types'

const getModels = (
  nnId: number,
): AppThunk<Promise<Model[] | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const result = await fetchJson(`${baseUrl}/neural_networks/${nnId}/models?tk=${token}`)
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get models', 'error'))
    }
    console.error(e)
    return null
  }
}

export default getModels
