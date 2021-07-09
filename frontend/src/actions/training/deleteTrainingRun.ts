export const DELETE_TRAINING_RUN = 'DELETE_TRAINING_RUN'
export type DeleteTrainingRun = {
  type: string,
  id: number,
}

const deleteTrainingRun = (id: number): DeleteTrainingRun => ({
  type: DELETE_TRAINING_RUN,
  id,
})

export default deleteTrainingRun
