import { getToken, fetchJson, StatusError } from 'utils'
import * as R from 'ramda'
import setInfo from 'actions/general/setInfo'
import setCollections from 'actions/ingest/setCollections'
import { AppThunk } from 'store'
import { Collection } from 'types'

const addCollectionFrames = (
  collectionId: number,
  collectionName: string,
  frameIds: number[],
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const body = JSON.stringify({ frameIds })
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

    const result = await fetchJson(`${baseUrl}/collections/${collectionId}/frames?tk=${token}`, ops)
    const infoMessage = `${frameIds.length} frames added to collection: ${collectionName}`
    const { collections } = getState().ingest

    const index = R.findIndex(({ id }) => id === result.id, collections || [])

    dispatch(setCollections(R.update(index, result as Collection, collections || [])))
    dispatch(setInfo(true, infoMessage))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to add frame to collection', 'error'))
    }
  }
}

export default addCollectionFrames
