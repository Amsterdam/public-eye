import { combineReducers } from 'redux'
import general from './general'
import training from './training'
import jobs from './jobs'
import navigator from './navigator'
import users from './users'
import cameras from './cameras'
import frames from './frames'
import deploys from './deploys'
import datasets from './datasets'
import pagination from './pagination'
import ingest from './ingest'

const combineReducer = combineReducers({
  ingest,
  general,
  training,
  jobs,
  navigator,
  users,
  cameras,
  frames,
  deploys,
  datasets,
  pagination,
})

export type RootState = ReturnType<typeof combineReducer>

export default combineReducer
