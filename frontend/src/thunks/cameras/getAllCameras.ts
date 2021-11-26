import setAllCameras from 'actions/cameras/setAllCameras'
import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { Camera } from 'types'

const getAllCameras = (): AppThunk<void> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/cameras?tk=${token}`
    const result = await fetchJson(url)
    dispatch(setAllCameras(result as unknown as Camera[]))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get cameras', 'error'))
    }
  }
}

export default getAllCameras
