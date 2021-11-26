import { getToken, fetchJson, StatusError } from 'utils'
import setFrames from 'actions/navigator/setFrames'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { Frame } from 'types'

const fetchCollectionFrames = (
  collectionId: number,
  skip: number,
  limit: number,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const { baseUrl } = getState().general
    const token = getToken()
    const json = await fetchJson(`${baseUrl}/collections/${collectionId}/frames/?tk=${token}&skip=${skip}&limit=${limit}`)
    const frames = (json as unknown as Frame[]).map(
      (frame: Frame) => ({ ...frame, item_id: collectionId }),
    ) as Frame[]

    dispatch(setFrames(frames))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to fetch collection frames', 'error'))
    }
  }
}

export default fetchCollectionFrames
