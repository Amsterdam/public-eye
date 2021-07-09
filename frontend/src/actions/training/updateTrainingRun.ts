export const UPDATE_TRAINING_RUN = 'UPDATE_TRAINING_RUN'
export type UpdateTrainingRun = {
  jobId: number,
  property: string,
  value: string | number,
  type: string,
}

const updateTrainingRun = (
  jobId: number, property: string, value: string | number,
): UpdateTrainingRun => ({
  type: UPDATE_TRAINING_RUN,
  jobId,
  property,
  value,
})

export default updateTrainingRun
