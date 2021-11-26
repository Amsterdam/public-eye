import { batch } from 'react-redux'
import setLogData from 'actions/jobs/setLogData'
import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const restartJob = (jobId: number): AppThunk<void> => async (dispatch, getState) => {
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
    await fetchAndDiscard(`${baseUrl}/jobs/${jobId}/restart?tk=${token}`, ops)
    batch(() => {
      // reset log when job restarts
      dispatch(setLogData(jobId, ''))
    })
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to restart this job', 'error'))
    }
  }
}

export default restartJob
