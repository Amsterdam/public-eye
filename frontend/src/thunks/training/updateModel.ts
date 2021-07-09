import { getToken, fetchJson, StatusError } from 'utils'
import { batch } from 'react-redux'
import setInfo from 'actions/general/setInfo'
import setOrAddModel from 'actions/training/setOrAddModel'
import { AppThunk } from 'store'

const updateModel = (
  id: number,
  annotation: string,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const ops = {
      method: 'PATCH',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        annotation,
      }),
    }

    const result = await fetchJson(`${baseUrl}/neural_networks/models/${id}?tk=${token}`, ops)
    batch(() => {
      dispatch(setInfo(true, 'Annotation updated'))
      dispatch(setOrAddModel(result))
    })
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to annotate model', 'error'))
    }
    console.error('error', e)
    return false
  }
}

export default updateModel
