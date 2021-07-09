import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const deleteCollection = (id: number): AppThunk<void> => async (dispatch, getState) => {
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
        scriptName: 'delete_collection.py',
        scriptArgs: {
          collection_id: id,
        },
      }),
    }

    await fetchAndDiscard(`${baseUrl}/jobs?tk=${token}`, ops)
    dispatch(setInfo(true, 'Starting to delete colection'))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete collection', 'error'))
    }
  }
}

export default deleteCollection
