import * as R from 'ramda'
import { batch } from 'react-redux'
import { getToken, fetchJson, StatusError } from 'utils'
import setCollections from 'actions/ingest/setCollections'
import setAllCollections from 'actions/ingest/setAllCollections'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { Collection } from 'types'

const createNewCollection = (
  collectionName: string,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const body = JSON.stringify({ collectionName })
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
    const { collections } = getState().ingest

    const result = await fetchJson(`${baseUrl}/collections/?tk=${token}`, ops)
    const collection = {
      ...result,
      frame_count: result.frame_count === null ? '0' : result.frame_count as string,
    }
    const infoMessage = `A collection has been created with name: ${collectionName}`
    const { allCollections } = getState().ingest
    batch(() => {
      dispatch(setCollections(R.append(collection as Collection, collections || [])))
      dispatch(setAllCollections(R.append(result as Collection, allCollections || [])))
      dispatch(setInfo(true, infoMessage))
    })
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to start this job', 'error'))
    }
  }
}

export default createNewCollection
