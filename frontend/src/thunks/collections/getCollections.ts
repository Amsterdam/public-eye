import { batch } from 'react-redux'
import setCollections from 'actions/ingest/setCollections'
import setPagination from 'actions/pagination/setPagination'
import { getToken, fetchJson } from 'utils'
import { AppThunk } from 'store'
import { Collection } from 'types'

const getCollections = (
  skip: number,
  limit: number,
  filter: string,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
  try {
    dispatch(setCollections([]))
    const token = getToken()
    const { baseUrl } = getState().general
    let url = `${baseUrl}/collections?tk=${token}&skip=${skip}`
    if (limit) {
      url += `&limit=${limit}`
    }
    if (filter) {
      url += `&filter=${filter}`
    }
    const result = await fetchJson(url)
    const { items, count } = result
    const collections = (items as Collection[]).map((col) => ({
      ...col,
      frame_count: col.frame_count === null ? 0 : col.frame_count,
    })) as Collection[]
    batch(() => {
      dispatch(setCollections(collections))
      try {
        return dispatch(setPagination('collections', Number(count)))
      } catch (e) {
        return null
      }
    })
    return null
  } catch (e) {
    return null
  }
}

export default getCollections
