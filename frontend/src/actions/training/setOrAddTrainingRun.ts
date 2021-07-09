import { TrainingRun } from 'types'

export const SET_OR_ADD_TRAINING_RUN = 'SET_OR_ADD_TRAINING_RUN'
export type SetOrAddTrainingRun = {
  type: string,
  trainingRun: TrainingRun,
}

const setOrAddTrainingRun = (trainingRun: TrainingRun): SetOrAddTrainingRun => ({
  type: SET_OR_ADD_TRAINING_RUN,
  trainingRun,
})

export default setOrAddTrainingRun
