import { batch } from 'react-redux'
import setLogData from 'actions/jobs/setLogData'
import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { Job } from 'types'

const getJob = (
  jobId: number,
): AppThunk<Promise<Job | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const job = await fetchJson(`${baseUrl}/jobs/${jobId}?tk=${token}`)

    return job
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get this job', 'error'))
    }
    return null
  }
}

export default getJob
