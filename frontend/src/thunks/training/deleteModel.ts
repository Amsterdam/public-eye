import { getToken, fetchAndDiscard, StatusError } from 'utils'
import { batch } from 'react-redux'
import setInfo from 'actions/general/setInfo'
import deleteModelAction from 'actions/training/deleteModel'
import { AppThunk } from 'store'

const deleteModel = (
  modelId: number,
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

    await fetchAndDiscard(`${baseUrl}/neural_networks/models/${modelId}?tk=${token}`, ops)
    // remove delete training run from state
    batch(() => {
      dispatch(setInfo(true, 'Model deleted'))
      dispatch(deleteModelAction(modelId))
    })
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete model', 'error'))
    }
    console.error('error', e)
    return false
  }
}

export default deleteModel
