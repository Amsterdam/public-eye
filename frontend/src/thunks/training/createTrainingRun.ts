import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { TrainingRun } from 'types'

const createTrainingRun = (
  payLoad: Record<string, unknown>,
): AppThunk<Promise<TrainingRun | null>> => async (dispatch, getState) => {
  try {
    const body = JSON.stringify(payLoad)
    const ops = {
      body,
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    }
    const token = getToken()
    const { baseUrl } = getState().general
    const json = await fetchJson(`${baseUrl}/jobs/train?tk=${token}`, ops)
    const infoMessage = `Job started to train model with script: ${String(payLoad.scriptName)}`
    dispatch(setInfo(true, infoMessage))
    return json
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to create training run', 'error'))
    }
    console.error(e)
    return null
  }
}

export default createTrainingRun
