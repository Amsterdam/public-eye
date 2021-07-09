import { Job } from 'types'

export const SET_OR_ADD_JOB = 'SET_OR_ADD_JOB'
export type SetOrAddJob = {
  type: string,
  job: Job,
}

const setOrAddJob = (job: Job): SetOrAddJob => ({
  type: SET_OR_ADD_JOB,
  job,
})

export default setOrAddJob
