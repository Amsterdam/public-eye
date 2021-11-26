import { batch } from 'react-redux'
import { getToken, fetchJson, StatusError } from 'utils'
import setTrainingRuns from 'actions/training/setTrainingRuns'
import setInfo from 'actions/general/setInfo'
import setPagination from 'actions/pagination/setPagination'
import { AppThunk } from 'store'
import { TrainingRun } from 'types'

const getTrainingRuns = (
  skip = 0,
  limit = 25,
): AppThunk<Promise<boolean | null>> => async (dispatch, getState) => {
  try {
    dispatch(setTrainingRuns([]))
    const token = getToken()
    const { baseUrl } = getState().general

    const result = await fetchJson(`${baseUrl}/training_runs?tk=${token}&skip=${skip}&limit=${limit}`)
    const { count, items } = result

    batch(() => {
      dispatch(setPagination('trainingRuns', Number(count)))
      dispatch(setTrainingRuns(items as TrainingRun[]))
    })

    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get training runs', 'error'))
    }
    return null
  }
}

export default getTrainingRuns
