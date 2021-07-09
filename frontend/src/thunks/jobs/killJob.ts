import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const killJob = (
  jobId: number,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    }
    const token = getToken()
    const { baseUrl } = getState().general
    await fetchAndDiscard(`${baseUrl}/jobs/${jobId}/kill?tk=${token}`, ops)
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to kill this job', 'error'))
    }
    return false
  }
}

export default killJob
