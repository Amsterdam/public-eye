import setLogData from 'actions/jobs/setLogData'
import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const MAX_SIZE = 1000

const getLogDump = (
  jobId: number,
  offset: string | null = null,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    let url = `${baseUrl}/jobs/${jobId}/log?tk=${token}&maxSize=${MAX_SIZE}`
    if (offset) {
      url += `&offset=${offset}`
    }
    const result = await fetchJson(url)
    dispatch(setLogData(jobId, result.content as string))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to retrieve log dump', 'error'))
    }
  }
}

export default getLogDump
