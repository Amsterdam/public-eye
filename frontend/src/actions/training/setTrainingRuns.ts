import { TrainingRun } from 'types'

export const SET_TRAINING_RUNS = 'SET_TRAINING_RUNS'
export type SetTrainingRuns = {
  type: string,
  trainingRuns: TrainingRun[],
}

const setTrainingRuns = (trainingRuns: TrainingRun[]): SetTrainingRuns => ({
  type: SET_TRAINING_RUNS,
  trainingRuns,
})

export default setTrainingRuns
