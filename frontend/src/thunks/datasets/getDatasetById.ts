import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { Dataset } from 'types'

const getDatasetById = (id: number): AppThunk<Promise<Dataset | null>> => async (
  dispatch, getState,
) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const json = await fetchJson(`${baseUrl}/datasets/${id}?tk=${token}`)
    return json
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get dataset', 'error'))
    }
    return null
  }
}

export default getDatasetById
