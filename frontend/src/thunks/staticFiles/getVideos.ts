import { batch } from 'react-redux'
import setVideos from 'actions/ingest/setVideos'
import setPagination from 'actions/pagination/setPagination'
import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { Video } from 'types'

type ResultType = {
  items: Video[],
  count: number,
}
const getVideos = (
  skip: number,
  limit: number,
  filter: string,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    dispatch(setVideos(null))
    const token = getToken()
    const { baseUrl } = getState().general

    let url = `${baseUrl}/files/videos?tk=${token}&skip=${skip}&limit=${limit}`
    if (filter) {
      url += `&filter=${filter}`
    }
    const result = await fetchJson(url)

    const { items, count } = result as ResultType
    const videos = items.map((video) => (
      { ...video, frame_count: video.frame_count === null ? 0 : video.frame_count }))
    batch(() => {
      dispatch(setVideos(videos))
      dispatch(setPagination('videos', Number(count)))
    })
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get videos', 'error'))
    }
  }
}

export default getVideos
