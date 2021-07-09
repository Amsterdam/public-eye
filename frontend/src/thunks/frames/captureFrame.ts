import { batch } from 'react-redux'
import * as R from 'ramda'
import addFrame from 'actions/ingest/addFrame'
import setInfo from 'actions/general/setInfo'
import setVideos from 'actions/ingest/setVideos'
import {
  getFileName, stringIntegerArithmetic, getToken, fetchJson,
} from 'utils'
import { AppThunk } from 'store'

const captureFrame = (
  videoId: number,
  timestamp: number,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const body = JSON.stringify({
      timestamp,
    })
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

    const url = `${baseUrl}/files/videos/${videoId}/frames/?tk=${token}`
    const json = await fetchJson(url, ops)

    const fileName = getFileName(json.path)
    const infoMessage = `Frame has been captured with name: ${fileName}`

    // update frame count for video
    let { videos } = getState().ingest
    const videoIndex = R.findIndex(({ id }) => id === json.video_file_id)(videos)
    if (videoIndex !== -1) {
      const updatedVideo = {
        ...videos[videoIndex],
        frame_count: stringIntegerArithmetic(
          videos[videoIndex].frame_count, (x) => Number(x) + 1,
        ),
      }
      videos = R.update(videoIndex, updatedVideo)(videos)
    }

    batch(() => {
      dispatch(setVideos(videos))
      dispatch(setInfo(true, infoMessage))
      dispatch(addFrame(videoId, json))
    })
  } catch (e) {
    console.error(e)
    dispatch(setInfo(true, 'Capturing frame failed.', 'error'))
  }
}

export default captureFrame
