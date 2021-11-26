import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import setCachedTrainingRun from 'actions/training/setCachedTrainingRun'
import { TrainingRun } from 'types'
import { AppThunk } from 'store'

const getTrainingRunByJobId = (
  jobId: number,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const result = await fetchJson(`${baseUrl}/training_runs/${jobId}?tk=${token}`)
    dispatch(setCachedTrainingRun(result as TrainingRun))

    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get training runs', 'error'))
    }
    return null
  }
}

export default getTrainingRunByJobId
