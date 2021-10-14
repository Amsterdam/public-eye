import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import setOrAddCachedDeploy from 'actions/deploys/setOrAddCachedDeploy'
import { Deploy } from 'types'
import { AppThunk } from 'store'

const getDeployByJobId = (
  jobId: number,
): AppThunk<Promise<Deploy | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const result = await fetchJson(`${baseUrl}/deploys/${jobId}?tk=${token}`)
    dispatch(setOrAddCachedDeploy(result as Deploy))

    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get deploy', 'error'))
    }
    console.error(e)
    return null
  }
}

export default getDeployByJobId
