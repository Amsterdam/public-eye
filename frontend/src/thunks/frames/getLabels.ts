import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { ObjectLabel } from 'types'

const getLabels = (): AppThunk<Promise<ObjectLabel[] | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const json = await fetchJson(`${baseUrl}/frames/bounding_boxes/labels?tk=${token}`)
    return json
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to fetch bounding box labels', 'error'))
    }
    return null
  }
}

export default getLabels
