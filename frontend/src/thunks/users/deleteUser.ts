import { getToken, fetchAndDiscard, StatusError } from 'utils'
import deleteUserAction from 'actions/users/deleteUser'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const deleteUser = (
  id: number,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const ops = {
      method: 'DELETE',
    }
    const token = getToken()
    const { baseUrl } = getState().general
    await fetchAndDiscard(`${baseUrl}/users/${id}?tk=${token}`, ops)
    dispatch(deleteUserAction(id))
    dispatch(setInfo(true, 'Deleted user'))

    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete user', 'error'))
    }
    console.error(e)
    return false
  }
}

export default deleteUser
