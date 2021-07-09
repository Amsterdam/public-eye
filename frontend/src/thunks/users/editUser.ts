import { getToken, fetchJson, StatusError } from 'utils'
import editUserAction from 'actions/users/editUser'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const editUser = (
  id: string,
  email: string,
  password: string,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const ops = {
      method: 'PATCH',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        email,
        password,
      }),
    }
    const token = getToken()
    const { baseUrl } = getState().general
    const json = await fetchJson(`${baseUrl}/users/${id}?tk=${token}`, ops)

    dispatch(editUserAction(json))
    dispatch(setInfo(true, 'User edited'))
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to edit user', 'error'))
    }
    console.error(e)
    return false
  }
}

export default editUser
