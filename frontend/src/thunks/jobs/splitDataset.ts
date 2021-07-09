import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

type ScriptArgs = {
  dataset_id: number,
  split: number,
  dataset_name_1: string,
  dataset_name_2: string,
}

const splitDataset = (scriptArgs: ScriptArgs): AppThunk<void> => async (
  dispatch, getState,
) => {
  try {
    const body = JSON.stringify({
      scriptName: 'split_dataset.py',
      scriptArgs,
    })
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body,
    }
    const token = getToken()
    const { baseUrl } = getState().general
    await fetchAndDiscard(`${baseUrl}/jobs?tk=${token}`, ops)
    const infoMessage = 'Job started to split dataset'
    dispatch(setInfo(true, infoMessage))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to split datasets', 'error'))
    }
  }
}

export default splitDataset
