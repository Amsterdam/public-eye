import { getToken, fetchJson, StatusError } from 'utils'
import { batch } from 'react-redux'
import setInfo from 'actions/general/setInfo'
import addModelTag from 'actions/training/addModelTag'
import { AppThunk } from 'store'
import { ModelTag } from 'types'

const insertModelTag = (
  name: string,
): AppThunk<Promise<ModelTag | false>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        name,
      }),
    }

    const result = await fetchJson(`${baseUrl}/neural_networks/models/tags?tk=${token}`, ops)
    batch(() => {
      dispatch(setInfo(true, 'New model tag created'))
      dispatch(addModelTag(result))
    })
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to annotate model', 'error'))
    }
    console.error('error', e)
    return false
  }
}

export default insertModelTag
