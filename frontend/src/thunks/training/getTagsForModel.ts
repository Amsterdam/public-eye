import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { ModelTag } from 'types'

const getTagsForModel = (
  modelId: number,
): AppThunk<Promise<ModelTag[] | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const result = await fetchJson(`${baseUrl}/neural_networks/models/${modelId}/tags?tk=${token}`)

    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get model tags', 'error'))
    }
    console.error(e)
    return null
  }
}

export default getTagsForModel
