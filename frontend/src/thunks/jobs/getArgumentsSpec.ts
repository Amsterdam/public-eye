import { getToken, fetchJson, StatusError } from 'utils'
import setArgumentSpec from 'actions/jobs/setArgumentSpec'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const getArgumentsSpec = (): AppThunk<void> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const result = await fetchJson(`${baseUrl}/jobs/arg_spec?tk=${token}`)

    dispatch(setArgumentSpec(result))
  } catch (e) {
    console.error(e)
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized retrieve jobs arguments spec', 'error'))
    }
  }
}

export default getArgumentsSpec
