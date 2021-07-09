import * as R from 'ramda'
import { getToken, fetchJson, StatusError } from 'utils'
import setVideos from 'actions/ingest/setVideos'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const updateVideo = (
  videoFileID: string,
  fileName: string,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const ops = {
      method: 'PUT',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        fileName,
      }),
    }

    const video = await fetchJson(`${baseUrl}/files/videos/${videoFileID}?tk=${token}`, ops)
    const { videos } = getState().general
    const index = R.findIndex((tempVideo) => tempVideo.id === Number(videoFileID), videos)

    if (index === -1) {
      return true
    }

    // update videos
    const videoObject = {
      ...video,
      type: 'video',
      frame_count: video.frame_count ? video.frame_count : 0,
    }
    dispatch(setVideos(R.update(index, videoObject, videos)))

    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to update video', 'error'))
    }
    return false
  }
}

export default updateVideo
