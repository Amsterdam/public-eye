import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { Video } from 'types'

const getVideoFile = (
  id: number,
): AppThunk<Promise<Video | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const result = await fetchJson(`${baseUrl}/files/video_file/${id}?tk=${token}`)
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get video', 'error'))
    }
    return null
  }
}

export default getVideoFile
