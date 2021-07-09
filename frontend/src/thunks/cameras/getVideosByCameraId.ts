import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { Video } from 'types'
import { AppThunk } from 'store'

const getVideosByCameraId = (
  id: number,
): AppThunk<Promise<Video[] | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/cameras/${id}/videos?tk=${token}`
    const result = await fetchJson(url)
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to videos', 'error'))
    }
    return null
  }
}

export default getVideosByCameraId
