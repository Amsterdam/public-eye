import { Video } from 'types'

export const SET_VIDEOS = 'SET_VIDEOS'
export type SetVideos = {
  type: string,
  videos: Video[],
}

const setVideos = (videos: Video[]): SetVideos => ({
  type: SET_VIDEOS,
  videos,
})

export default setVideos
