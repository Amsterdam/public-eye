import { getToken, fetchAndDiscard, StatusError } from 'utils'
import { batch } from 'react-redux'
import * as R from 'ramda'
import setInfo from 'actions/general/setInfo'
import setVideos from 'actions/ingest/setVideos'
import { AppThunk } from 'store'

const deleteVideo = (
  videoFileID: string,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const ops = {
      method: 'DELETE',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    }

    await fetchAndDiscard(`${baseUrl}/files/videos/${videoFileID}?tk=${token}`, ops)
    const { videos } = getState().ingest
    const index = R.findIndex((video) => video.id === Number(videoFileID), videos || [])
    batch(() => {
      dispatch(setVideos(R.remove(index, 1, videos || [])))
      dispatch(setInfo(true, 'Video is deleted'))
    })
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete video', 'error'))
    }
    if ((e as StatusError).status === 409) {
      dispatch(setInfo(true, 'Video cannot be deleted because it still has frames.', 'error'))
      return false
    }
    return false
  }
}

export default deleteVideo
