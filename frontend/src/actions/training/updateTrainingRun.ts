export const UPDATE_TRAINING_RUN = 'UPDATE_TRAINING_RUN'
type Property = (
  'id' |
  'config_id' |
  'job_id' |
  'job_status' |
  'model_name' |
  'train_script' |
  'job_script_payload' |
  'nn_type'
)
export type UpdateTrainingRun = {
  jobId: number,
  property: Property,
  value: string | number,
  type: string,
}

const updateTrainingRun = (
  jobId: number, property: Property, value: string | number,
): UpdateTrainingRun => ({
  type: UPDATE_TRAINING_RUN,
  jobId,
  property,
  value,
})

export default updateTrainingRun
