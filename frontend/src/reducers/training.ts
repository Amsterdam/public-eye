import * as R from 'ramda'

import { SET_TRAINING_RUNS, SetTrainingRuns } from 'actions/training/setTrainingRuns'
import {
  SET_OR_ADD_TRAINING_RUN, SetOrAddTrainingRun,
} from 'actions/training/setOrAddTrainingRun'
import { UPDATE_TRAINING_RUN, UpdateTrainingRun } from 'actions/training/updateTrainingRun'
import { DELETE_TRAINING_RUN, DeleteTrainingRun } from 'actions/training/deleteTrainingRun'
import { SET_CHART_DATA, SetChartData } from 'actions/training/setChartData'
import { ADD_CHART_DATA_ROW, AddChartDataRow } from 'actions/training/addChartDataRow'
import { RESET_STATE, ResetStateAction } from 'actions/general/resetState'
import { SET_VIEW_MODE, SetViewMode } from 'actions/training/setViewMode'
import { SET_MODELS, SetModels } from 'actions/training/setModels'
import { SET_OR_ADD_MODEL, SetOrAddModel } from 'actions/training/setOrAddModel'
import { SET_MODEL_TAGS, SetModelTags } from 'actions/training/setModelTags'
import { ADD_MODEL_TAG, AddModelTag } from 'actions/training/addModelTag'
import { ADD_TRAINING_RUN, AddTrainingRun } from 'actions/training/addTrainingRun'
import { SET_CACHED_TRAINING_RUN, SetCachedTrainingRun } from 'actions/training/setCachedTrainingRun'
import { UPDATE_CACHED_TRAINING_RUN, UpdateCachedTrainingRun } from 'actions/training/updateCachedTrainingRun'
import { DELETE_MODEL, DeleteModel } from 'actions/training/deleteModel'
import { Model, TrainingRun, ModelTag } from 'types'

type TrainingReducer = {
  trainingRuns: Map<number, TrainingRun> | null,
  trainingRunsCache: Map<number, TrainingRun>,
  models: Map<number, Model> | null,
  chartData: (number[] | string[])[],
  viewMode: number,
  modelTags: ModelTag[],
}

const defaultState: TrainingReducer = {
  trainingRuns: new Map<number, TrainingRun>(),
  trainingRunsCache: new Map<number, TrainingRun>(),
  models: new Map<number, Model>(),
  chartData: [],
  viewMode: 0,
  modelTags: [],
}

const actionToModels = (action: SetModels): Map<number, Model> | null => {
  if (action.models === null) {
    return null
  }
  const newModels = new Map<number, Model>()

  action.models.forEach((model: Model) => {
    newModels.set(model.id, model)
  })
  return newModels
}

const setTrainingRunsAction = (
  state: TrainingReducer, action: SetTrainingRuns,
): TrainingReducer => {
  if (action.trainingRuns === null) {
    return {
      ...state,
      trainingRuns: null,
    }
  }
  const newTrainingRunMap = new Map<number, TrainingRun>()

  action.trainingRuns.forEach((tr: TrainingRun) => {
    newTrainingRunMap.set(tr.job_id, tr)
  })

  return {
    ...state,
    trainingRuns: newTrainingRunMap,
  }
}

const numberCompare = (a: string | number, b: string | number): boolean => {
  try {
    return Number(a) === Number(b)
  } catch {
    return false
  }
}

type ReducerAction = (
  SetOrAddTrainingRun
  | UpdateTrainingRun
  | DeleteTrainingRun
  | SetChartData
  | AddChartDataRow
  | ResetStateAction
  | SetViewMode
  | SetOrAddModel
  | SetModelTags
  | AddModelTag
  | SetCachedTrainingRun
  | DeleteModel
)

const addModelTag = (
  state: TrainingReducer, action: AddModelTag,
): TrainingReducer => ({
  ...state,
  modelTags: [...state.modelTags, action.modelTag],
})

const setModelTags = (
  state: TrainingReducer, action: SetModelTags,
): TrainingReducer => ({
  ...state,
  modelTags: action.modelTags,
})

const setOrAddModel = (
  state: TrainingReducer, action: SetOrAddModel,
): TrainingReducer => ({
  ...state,
  models: new Map(state.models.set(action.model.id, action.model)),
})

const setModels = (
  state: TrainingReducer, action: SetModels,
): TrainingReducer => ({
  ...state,
  models: actionToModels(action),
})

const setViewMode = (
  state: TrainingReducer, action: SetViewMode,
): TrainingReducer => ({
  ...state,
  viewMode: action.viewMode,
})

const isSelectedTrainingRun = (jobId: string | number): boolean => {
  const urlParts = R.split('/', window.location.pathname)

  return (
    urlParts.length > 3
    && urlParts[1] === 'train'
    && urlParts[2] === 'runs'
    && numberCompare(urlParts[3], jobId)
  )
}

const addChartDataRow = (state: TrainingReducer, action: AddChartDataRow) => ({
  ...state,
  chartData: isSelectedTrainingRun(action.jobId)
    ? R.append(action.row)(state.chartData)
    : state.chartData,
})

const deleteTrainingRun = (state: TrainingReducer, action: DeleteTrainingRun) => {
  state.trainingRuns.delete(action.id)

  return {
    ...state,
    trainingRuns: new Map(state.trainingRuns),
  }
}

const deleteModel = (state: TrainingReducer, action: DeleteModel) => {
  state.models.delete(action.id)

  return {
    ...state,
    models: new Map(state.models),
  }
}

const setOrAddTrainingRun = (
  state: TrainingReducer, action: SetOrAddTrainingRun,
): TrainingReducer => ({
  ...state,
  trainingRuns:
    new Map(state.trainingRuns.set(action.trainingRun.job_id, action.trainingRun)),
})

const setCachedTrainingRun = (
  state: TrainingReducer, action: SetCachedTrainingRun,
): TrainingReducer => ({
  ...state,
  trainingRunsCache:
    new Map(state.trainingRunsCache.set(action.trainingRun.job_id, action.trainingRun)),
})

const updateTrainingRun = (
  state: TrainingReducer, action: UpdateTrainingRun,
): TrainingReducer => ({
  ...state,
  trainingRuns: new Map(
    state.trainingRuns.set(
      action.jobId,
      {
        ...state.trainingRuns.get(action.jobId),
        [action.property]: action.value,
      },
    ),
  ),
})

const updateCachedTrainingRun = (
  state: TrainingReducer, action: UpdateCachedTrainingRun,
): TrainingReducer => ({
  ...state,
  vv: console.log(action),
  trainingRunsCache: new Map(
    state.trainingRunsCache.set(
      action.jobId,
      {
        ...state.trainingRunsCache.get(action.jobId),
        [action.property]: action.value,
      },
    ),
  ),
})

const addTrainingRun = (
  state: TrainingReducer, action: AddTrainingRun,
): TrainingReducer => ({
  ...state,
  trainingRuns: new Map([
    [action.trainingRun.job_id, action.trainingRun],
    ...Array.from(state.trainingRuns.entries()),
  ]),
})

const setChartDate = (state: TrainingReducer, action: SetChartData) => ({
  ...state,
  chartData: action.chartData,
})

const reducer = (state = defaultState, action: ReducerAction): TrainingReducer => {
  switch (action.type) {
    case ADD_TRAINING_RUN:
      return addTrainingRun(state, action as AddTrainingRun)
    case ADD_MODEL_TAG:
      return addModelTag(state, action as AddModelTag)
    case SET_MODEL_TAGS:
      return setModelTags(state, action as SetModelTags)
    case SET_OR_ADD_MODEL:
      return setOrAddModel(state, action as SetOrAddModel)
    case SET_MODELS:
      return setModels(state, action as SetModels)
    case SET_VIEW_MODE:
      return setViewMode(state, action as SetViewMode)
    case RESET_STATE:
      return defaultState
    case ADD_CHART_DATA_ROW:
      return addChartDataRow(state, action as AddChartDataRow)
    case SET_TRAINING_RUNS:
      return setTrainingRunsAction(state, action as SetTrainingRuns)
    case DELETE_TRAINING_RUN:
      return deleteTrainingRun(state, action as DeleteTrainingRun)
    case SET_OR_ADD_TRAINING_RUN:
      return setOrAddTrainingRun(state, action as SetOrAddTrainingRun)
    case UPDATE_TRAINING_RUN:
      return updateTrainingRun(state, action as UpdateTrainingRun)
    case UPDATE_CACHED_TRAINING_RUN:
      return updateCachedTrainingRun(state, action as UpdateCachedTrainingRun)
    case SET_CACHED_TRAINING_RUN:
      return setCachedTrainingRun(state, action as SetCachedTrainingRun)
    case SET_CHART_DATA:
      return setChartDate(state, action as SetChartData)
    case DELETE_MODEL:
      return deleteModel(state, action as DeleteModel)
    default:
      return state
  }
}

export default reducer
