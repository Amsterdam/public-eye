import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import setOrAddFrame from 'actions/frames/setOrAddFrame'
import { Frame } from 'types'

const getFrameById = (
  frameId: string | number,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const { baseUrl } = getState().general
    const token = getToken()
    const json = await fetchJson(`${baseUrl}/frames/${frameId}?tk=${token}`)

    dispatch(setOrAddFrame(json as Frame))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to fetch video frames', 'error'))
    }
  }
}

export default getFrameById
