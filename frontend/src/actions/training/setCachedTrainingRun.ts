import { TrainingRun } from 'types'

export const SET_CACHED_TRAINING_RUN = 'SET_CACHED_TRAINING_RUN'
export type SetCachedTrainingRun = {
  type: string,
  trainingRun: TrainingRun,
}

const setCachedTrainingRun = (trainingRun: TrainingRun): SetCachedTrainingRun => ({
  type: SET_CACHED_TRAINING_RUN,
  trainingRun,
})

export default setCachedTrainingRun
