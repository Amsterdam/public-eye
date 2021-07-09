import { getToken, fetchJson } from 'utils'
import { AppThunk } from 'store'

const getFramesAndLabelsForDataset = (
  datasetId: number,
): AppThunk<Promise<Record<string, unknown>>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const json = await fetchJson(`${baseUrl}/datasets/${datasetId}/frames?tk=${token}`)
    return json
  } catch (e) {
    return null
  }
}

export default getFramesAndLabelsForDataset
