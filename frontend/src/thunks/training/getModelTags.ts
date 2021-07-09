import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import setModelTags from 'actions/training/setModelTags'
import { AppThunk } from 'store'

const getModelTags = (): AppThunk<Promise<boolean | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const result = await fetchJson(`${baseUrl}/neural_networks/models/tags?tk=${token}`)

    dispatch(setModelTags(result))
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get model tags', 'error'))
    }
    console.error(e)
    return null
  }
}

export default getModelTags
