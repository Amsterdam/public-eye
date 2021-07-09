import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { Score } from 'types'

const getScores = (
  id: number,
): AppThunk<Promise<Score[] | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const result = await fetchJson(`${baseUrl}/training_runs/${id}/scores?tk=${token}`)
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get scores', 'error'))
    }
    console.error(e)
    return null
  }
}

export default getScores
