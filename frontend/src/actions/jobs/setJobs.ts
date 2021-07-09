import { Job } from 'types'

export const SET_JOBS = 'SET_JOBS'
export type SetJobs = {
  type: string,
  jobs: Job[] | null,
}

const setJobs = (jobs: Job[] | null): SetJobs => ({
  type: SET_JOBS,
  jobs,
})

export default setJobs
