import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const deleteRoi = (
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
    await fetchAndDiscard(`${baseUrl}/cameras/${cameraId}/roi/${roiId}?tk=${token}`, ops)
    dispatch(setInfo(true, 'Succesfully deleted region of interest'))
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete region of interest', 'error'))
    }
    console.error(e)
    return false
  }
}

export default deleteRoi
