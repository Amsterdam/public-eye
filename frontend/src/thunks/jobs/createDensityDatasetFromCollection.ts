import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

type ScriptArgs = {
  collection_id: number,
  nn_type: string,
  density_config: {
    sigma: number,
    beta: number,
  },
  dataset_name: string,
}

const createDatasetFromCollection = (
  scriptArgs: ScriptArgs,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const body = JSON.stringify({
      scriptName: 'create_density_dataset_from_collection.py',
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
    const infoMessage = `Job started to create dataset: ${scriptArgs.dataset_name}`
    dispatch(setInfo(true, infoMessage))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to start this job', 'error'))
    } else {
      dispatch(setInfo(true, 'Something went wrong starting job', 'error'))
    }
  }
}

export default createDatasetFromCollection
