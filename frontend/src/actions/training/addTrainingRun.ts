import { TrainingRun } from 'types'

export const ADD_TRAINING_RUN = 'ADD_TRAINING_RUN'
export type AddTrainingRun = {
  type: string,
  trainingRun: TrainingRun,
}

const addTrainingRun = (trainingRun: TrainingRun): AddTrainingRun => ({
  type: ADD_TRAINING_RUN,
  trainingRun,
})

export default addTrainingRun
