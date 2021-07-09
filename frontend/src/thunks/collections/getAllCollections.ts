import setAllCollections from 'actions/ingest/setAllCollections'
import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { Collection } from 'types'

const getAllCollections = (): AppThunk<void> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/collections?tk=${token}`
    const result = await fetchJson(url)
    const { items } = result
    const collections = (items as Collection[]).map((col: Collection) => ({
      ...col,
      frame_count: col.frame_count === null ? 0 : col.frame_count,
    })) as Collection[]
    dispatch(setAllCollections(collections))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get collections', 'error'))
    }
  }
}

export default getAllCollections
