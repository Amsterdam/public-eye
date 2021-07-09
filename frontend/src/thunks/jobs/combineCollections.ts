import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const combineCollections = (
  collectionIds: number[],
  collectionName: string,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const body = JSON.stringify({
      scriptName: 'combine_collections.py',
      scriptArgs: {
        collection_ids: collectionIds,
        collection_name: collectionName,
      },
    })
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body,
    }
    const token = getToken()
    const { baseUrl } = getState().general

    await fetchAndDiscard(`${baseUrl}/jobs?tk=${token}`, ops)
    const infoMessage = `Job started to combine collections into collection: ${collectionName}`
    dispatch(setInfo(true, infoMessage))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to start this job', 'error'))
    } else {
      dispatch(setInfo(true, 'Something went wrong starting job', 'error'))
    }
  }
}

export default combineCollections
