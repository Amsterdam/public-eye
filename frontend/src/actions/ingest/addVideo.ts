import { Video } from 'types'

export const ADD_VIDEO = 'ADD_VIDEO'
export type AddVideo = {
  type: string,
  video: Video,
}

const addVideo = (video: Video): AddVideo => ({
  type: ADD_VIDEO,
  video,
})

export default addVideo
