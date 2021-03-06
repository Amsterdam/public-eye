import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const deleteLoi = (
  cameraId: number,
  roiId: number,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const ops = {
      method: 'DELETE',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    }

    const token = getToken()
    const { baseUrl } = getState().general
    await fetchAndDiscard(`${baseUrl}/cameras/${cameraId}/loi/${roiId}?tk=${token}`, ops)
    dispatch(setInfo(true, 'Succesfully deleted line of interest'))
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete line of interest', 'error'))
    }
    return false
  }
}

export default deleteLoi
