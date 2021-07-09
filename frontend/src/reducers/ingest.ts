import * as R from 'ramda'

import { RESET_STATE } from 'actions/general/resetState'
import { SET_VIDEOS, SetVideos } from 'actions/ingest/setVideos'
import { SET_COLLECTIONS, SetCollection } from 'actions/ingest/setCollections'
import { ADD_FRAME, AddFrame } from 'actions/ingest/addFrame'
import { UPDATE_FRAME, UpdateFrame } from 'actions/ingest/updateFrame'
import { REMOVE_FRAME, RemoveFrame } from 'actions/ingest/removeFrame'
import { UPDATE_FRAME_COUNT, UpdateFrameCount } from 'actions/ingest/updateFrameCount'
import { SET_ALL_COLLECTIONS, SetAllCollections } from 'actions/ingest/setAllCollections'
import { ADD_VIDEO, AddVideo } from 'actions/ingest/addVideo'
import { stringIntegerArithmetic } from 'utils'

import {
  Video, Collection, Frame,
} from 'types'

type IngestReducer = {
  allCollections: Collection[] | null,
  videos: Video[] | null,
  collections: Collection[] | null,
  frames: {
    video: Frame[],
    collection: Frame[],
  },
}

const defaultState: IngestReducer = {
  allCollections: null,
  videos: null,
  collections: null,
  frames: {
    video: [],
    collection: [],
  },
}

const updateFrame = (
  state: IngestReducer, action: UpdateFrame,
): IngestReducer => {
  if (action.itemType === 'video') {
    const { videos } = state
    const index = R.findIndex(({ id }) => id === action.itemId, videos)

    if (index === -1) {
      return state
    }

    return {
      ...state,
      videos: R.update(
        index,
        {
          ...videos[index],
          frame_locked_count: stringIntegerArithmetic(
            videos[index].frame_locked_count, action.func,
          ),
        },
        videos,
      ),
    }
  }
  if (action.itemType === 'collection') {
    const { collections } = state
    const index = R.findIndex(({ id }) => id === action.itemId, collections)

    if (index === -1) {
      return state
    }

    return {
      ...state,
      collections: R.update(
        index,
        {
          ...collections[index],
          frame_locked_count: stringIntegerArithmetic(
            collections[index].frame_locked_count, action.func,
          ),
        },
        collections,
      ),
    }
  }

  return state
}

const removeFrame = (
  state: IngestReducer, action: RemoveFrame,
): IngestReducer => {
  const frames = R.pathOr([], ['frames', action.itemType, action.itemId], state)
  const index = R.findIndex(({ id }) => id === action.id, frames)

  if (index === -1) {
    return state
  }

  return {
    ...state,
    frames: {
      ...state.frames,
      [action.itemType]: {
        ...state.frames[action.itemType],
        [action.itemId]: R.remove(index, 1, frames),
      },
    },
  }
}

const updateFrameCount = (
  state: IngestReducer, action: UpdateFrameCount,
): IngestReducer => {
  if (action.itemType === 'video') {
    const { videos } = state
    const index = R.findIndex(({ id }) => id === action.itemId, videos)

    if (index === -1) {
      return state
    }

    const frameCount = stringIntegerArithmetic(videos[index].frame_count, action.func)
    return {
      ...state,
      videos: R.update(index, { ...videos[index], frame_count: frameCount }, videos),
    }
  }
  if (action.itemType === 'collection') {
    const { collections } = state
    const index = R.findIndex(({ id }) => id === action.itemId, collections)

    if (index === -1) {
      return state
    }

    const frameCount = stringIntegerArithmetic(collections[index].frame_count, action.func)
    return {
      ...state,
      collections: R.update(index, { ...collections[index], frame_count: frameCount }, collections),
    }
  }
  return state
}

type ReducerAction = (
  SetVideos
  | SetCollection
  | AddFrame
  | UpdateFrame
  | RemoveFrame
  | UpdateFrameCount
  | SetAllCollections
  | AddVideo
)

const setAllCollections = (
  state: IngestReducer,
  action: SetAllCollections,
): IngestReducer => ({
  ...state,
  allCollections: action.collections,
})

const setCollection = (
  state: IngestReducer,
  action: SetCollection,
): IngestReducer => ({
  ...state,
  collections: action.collections,
})

const setVideos = (
  state: IngestReducer,
  action: SetVideos,
): IngestReducer => ({
  ...state,
  videos: action.videos,
})

const addFrame = (
  state: IngestReducer,
  action: AddFrame,
): IngestReducer => ({
  ...state,
  frames: {
    ...state.frames,
    video: {
      ...state.frames.video,
      [action.id]: R.append(action.newFrame, state.frames.video[action.id]),
    },
  },
})

const addVideo = (
  state: IngestReducer,
  action: AddVideo,
): IngestReducer => ({
  ...state,
  videos: [...(state.videos || []), action.video],
})

const reducer = (state = defaultState, action: ReducerAction): IngestReducer => {
  switch (action.type) {
    case RESET_STATE:
      return defaultState
    case ADD_VIDEO:
      return addVideo(state, action as AddVideo)
    case SET_ALL_COLLECTIONS:
      return setAllCollections(state, action as SetAllCollections)
    case REMOVE_FRAME:
      return removeFrame(state, action as RemoveFrame)
    case UPDATE_FRAME:
      return updateFrame(state, action as UpdateFrame)
    case UPDATE_FRAME_COUNT:
      return updateFrameCount(state, action as UpdateFrameCount)
    case SET_COLLECTIONS:
      return setCollection(state, action as SetCollection)
    case SET_VIDEOS:
      return setVideos(state, action as SetVideos)
    case ADD_FRAME:
      return addFrame(state, action as AddFrame)
    default:
      return state
  }
}

export default reducer
