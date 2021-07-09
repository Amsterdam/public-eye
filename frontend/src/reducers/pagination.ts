import { SET_PAGINATION, SetPagination } from 'actions/pagination/setPagination'
import { RESET_STATE, ResetStateAction } from 'actions/general/resetState'

type Pagination = {
  total: number,
}

type GeneralReducer = {
  videos: Pagination,
  collections: Pagination,
  datasets: Pagination,
  jobs: Pagination,
  deploys: Pagination,
  trainingRuns: Pagination,
  models: Pagination,
}

const defaultState: GeneralReducer = {
  videos: {
    total: 1,
  },
  collections: {
    total: 1,
  },
  datasets: {
    total: 1,
  },
  jobs: {
    total: 1,
  },
  deploys: {
    total: 1,
  },
  trainingRuns: {
    total: 1,
  },
  models: {
    total: 1,
  },
}

type ReducerAction = (
  SetPagination
  | ResetStateAction
)

const setPagination = (state: GeneralReducer, action: SetPagination) => ({
  ...state,
  [action.itemType]: {
    total: action.total,
  },
})

const reducer = (state = defaultState, action: ReducerAction): GeneralReducer => {
  switch (action.type) {
    case RESET_STATE:
      return defaultState
    case SET_PAGINATION:
      return setPagination(state, action as SetPagination)
    default:
      return state
  }
}

export default reducer
