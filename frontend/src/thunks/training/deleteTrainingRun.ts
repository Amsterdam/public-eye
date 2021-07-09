import { getToken, fetchAndDiscard, StatusError } from 'utils'
import { batch } from 'react-redux'
import setInfo from 'actions/general/setInfo'
import deleteTrainingRunAction from 'actions/training/deleteTrainingRun'
import { TrainingRun } from 'types'
import { AppThunk } from 'store'

const deleteTrainingRun = (
  trainingRun: TrainingRun,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
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

    await fetchAndDiscard(`${baseUrl}/training_runs/${trainingRun.id}?tk=${token}`, ops)
    // remove delete training run from state
    batch(() => {
      dispatch(setInfo(true, 'Training run deleted'))
      dispatch(deleteTrainingRunAction(trainingRun.job_id))
    })
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete training run', 'error'))
    }
    console.error('error', e)
    return false
  }
}

export default deleteTrainingRun
