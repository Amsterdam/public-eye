import { batch } from 'react-redux'
import { getToken, fetchJson, StatusError } from 'utils'
import setJobs from 'actions/jobs/setJobs'
import setInfo from 'actions/general/setInfo'
import setPagination from 'actions/pagination/setPagination'
import { AppThunk } from 'store'
import { Job } from 'types'

const getAllJobs = (
  skip = 0,
  limit = 25,
): AppThunk<Promise<void>> => async (dispatch, getState) => {
  try {
    dispatch(setJobs(null))
    const token = getToken()
    const { baseUrl } = getState().general
    const result = await fetchJson(`${baseUrl}/jobs?tk=${token}&skip=${skip}&limit=${limit}`)
    const { items, count } = result
    batch(() => {
      dispatch(setJobs(items as Job[]))
      dispatch(setPagination('jobs', Number(count)))
    })
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized retrieve jobs', 'error'))
    }
  }
}

export default getAllJobs
