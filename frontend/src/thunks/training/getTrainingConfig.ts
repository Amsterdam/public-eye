import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const getTrainingConfig = (
  id: number,
): AppThunk<Promise<Record<string, unknown> | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const result = await fetchJson(`${baseUrl}/files/train_config/${id}?tk=${token}`)
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get training config', 'error'))
    }
    console.error(e)
    return null
  }
}

export default getTrainingConfig
