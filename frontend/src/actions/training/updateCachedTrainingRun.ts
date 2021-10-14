export const UPDATE_CACHED_TRAINING_RUN = 'UPDATE_CACHED_TRAINING_RUN'
export type UpdateCachedTrainingRun = {
  jobId: number,
  property: string,
  value: string | number,
  type: string,
}

const updateCachedTrainingRun = (
  jobId: number, property: string, value: string | number,
): UpdateCachedTrainingRun => ({
  type: UPDATE_CACHED_TRAINING_RUN,
  jobId,
  property,
  value,
})

export default updateCachedTrainingRun
