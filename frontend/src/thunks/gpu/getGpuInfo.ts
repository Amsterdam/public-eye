import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

export type Gpu = {
  'uuid': string,
  'name': string,
  'memory.used [MiB]': number,
  'memory.free [MiB]': number,
  'memory.total [MiB]': number,
  'temperature.gpu': number,
}

const getGpuInfo = (
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const json = await fetchJson(`${baseUrl}/gpu/info?tk=${token}`)
    return json
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not retrieve gpu count', 'error'))
    }
    return null
  }
}

export default getGpuInfo
