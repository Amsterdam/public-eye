import { getToken, fetchAndDiscard, StatusError } from 'utils'
import { batch } from 'react-redux'
import setInfo from 'actions/general/setInfo'
import deleteJobAction from 'actions/jobs/deleteJob'
import { AppThunk } from 'store'

const deleteJob = (
  jobId: number,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const ops = {
      method: 'DELETE',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    }

    await fetchAndDiscard(`${baseUrl}/jobs/${jobId}?tk=${token}`, ops)
    // remove delete training run from state
    batch(() => {
      dispatch(setInfo(true, 'Job deleted'))
      dispatch(deleteJobAction(jobId))
    })
  } catch (e) {
    if ((e as StatusError).status === 409) {
      dispatch(setInfo(true, 'Stream instance or Train run must be delete from their respective views', 'error'))
    } if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete this job', 'error'))
    } else {
      dispatch(setInfo(true, 'Something went wront deleting job'))
    }
  }
}

export default deleteJob
