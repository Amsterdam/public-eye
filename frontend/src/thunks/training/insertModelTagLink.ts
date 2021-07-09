import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { ModelTag } from 'types'

const insertModelTagLink = (
  modelId: number,
  modelTagId: number,
): AppThunk<Promise<ModelTag | null>> => async (dispatch, getState): Promise<ModelTag | null> => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    }

    const result = await fetchJson(`${baseUrl}/neural_networks/models/${modelId}/tags/${modelTagId}?tk=${token}`, ops)
    dispatch(setInfo(true, 'Model tag inserted'))
    return result as ModelTag
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to insert model tag link', 'error'))
    }
    console.error('error', e)
    return null
  }
}

export default insertModelTagLink
