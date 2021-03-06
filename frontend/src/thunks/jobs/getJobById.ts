import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const getJob = (
  jobId: number,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
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
