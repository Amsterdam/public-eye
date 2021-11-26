import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import deleteCameraAction from 'actions/cameras/deleteCamera'
import { AppThunk } from 'store'

const deleteCamera = (
  cameraId: number,
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
    await fetchAndDiscard(`${baseUrl}/cameras/${cameraId}?tk=${token}`, ops)
    dispatch(setInfo(true, 'Succesfully deleted camera'))
    dispatch(deleteCameraAction(Number(cameraId)))
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to submit region of interest', 'error'))
    } else if ((e as StatusError).status === 409) {
      dispatch(setInfo(true, 'Camera cannot be deleted because it is still used in a stream in the deploy view', 'error'))
    }
    return false
  }
}

export default deleteCamera
