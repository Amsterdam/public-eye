import { batch } from 'react-redux'
import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import deleteDatasetAction from 'actions/datasets/deleteDataset'

const deleteDataset = (
  id: number,
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

    await fetchAndDiscard(`${baseUrl}/datasets/${String(id)}?tk=${token}`, ops)

    batch(() => {
      dispatch(setInfo(true, 'Dataset deleted'))
      dispatch(deleteDatasetAction(id))
    })

    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete dataset', 'error'))
    }
    if ((e as StatusError).status === 409) {
      dispatch(setInfo(true, 'Dataset is still used by Train run', 'error'))
    }
    console.error('error', e)
    return false
  }
}

export default deleteDataset
