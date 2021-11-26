import {
  pipe,
  pathOr,
  concat,
} from 'ramda'

import { SET_JOBS, SetJobs } from 'actions/jobs/setJobs'
import { SET_OR_ADD_JOB, SetOrAddJob } from 'actions/jobs/setOrAddJob'
import { DELETE_JOB, DeleteJob } from 'actions/jobs/deleteJob'
import { SET_LOG_DATA, SetLogData } from 'actions/jobs/setLogData'
import { APPEND_LOG_DATA, AppendLogData } from 'actions/jobs/appendLogData'
import { RESET_STATE, ResetStateAction } from 'actions/general/resetState'
import { SET_ARGUMENT_SPEC, SetArgumentsSpec } from 'actions/jobs/setArgumentSpec'

import { Job } from 'types'

type JobsReducer = {
  jobs: Map<number, Job> | null,
  logData: Record<number, string>,
  // eslint-disable-next-line
  jobArgumentsSpec: Record<string, any> | null,
}

const defaultState: JobsReducer = {
  jobs: null,
  logData: {},
  jobArgumentsSpec: null,
}

const setJobsAction = (
  state: JobsReducer, action: SetJobs,
): JobsReducer => {
  if (action.jobs === null) {
    return {
      ...state,
      jobs: null,
    }
  }
  const newJobs = new Map<number, Job>()

  action.jobs.forEach((job: Job) => {
    newJobs.set(job.id, job)
  })

  return {
    ...state,
    jobs: newJobs,
  }
}

const setLogData = (
  state: JobsReducer, action: SetLogData,
): JobsReducer => ({
  ...state,
  logData: {
    ...state.logData,
    [action.jobId]: action.data,
  },
})

const appendLogData = (
  state: JobsReducer, action: SetLogData,
): JobsReducer => ({
  ...state,
  logData: {
    ...state.logData,
    [action.jobId]: (
      pipe(
        pathOr('', ['logData', action.jobId]),
        (logState) => concat(logState, action.data),
      )(state)
    ),
  },
})

const deleteJob = (
  state: JobsReducer, action: DeleteJob,
): JobsReducer => {
  if (state.jobs === null) {
    return state
  }

  state.jobs.delete(action.id)

  return {
    ...state,
    jobs: new Map(state.jobs),
  }
}

const setOrAddJob = (
  state: JobsReducer, action: SetOrAddJob,
): JobsReducer => (
  state.jobs === null
    ? state
    : ({
      ...state,
      jobs: new Map(state.jobs.set(action.job.id, action.job)),
    })
)

const setArgumentsSpec = (
  state: JobsReducer, action: SetArgumentsSpec,
): JobsReducer => ({
  ...state,
  jobArgumentsSpec: action.argumentSpec,
})

type ReducerAction = (
  SetJobs
  | SetOrAddJob
  | DeleteJob
  | SetLogData
  | AppendLogData
  | ResetStateAction
)

const reducer = (state = defaultState, action: ReducerAction): JobsReducer => {
  switch (action.type) {
    case RESET_STATE:
      return defaultState
    case SET_ARGUMENT_SPEC:
      return setArgumentsSpec(state, action as SetArgumentsSpec)
    case SET_JOBS:
      return setJobsAction(state, action as SetJobs)
    case SET_LOG_DATA:
      return setLogData(state, action as SetLogData)
    case APPEND_LOG_DATA:
      return appendLogData(state, action as AppendLogData)
    case DELETE_JOB:
      return deleteJob(state, action as DeleteJob)
    case SET_OR_ADD_JOB:
      return setOrAddJob(state, action as SetOrAddJob)
    default:
      return state
  }
}

export default reducer
