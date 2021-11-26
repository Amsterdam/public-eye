import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const editEmail = (
  id: number,
  email: string,
  currentPassword: string,
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
        currentPassword,
      }),
    }
    const token = getToken()
    const { baseUrl } = getState().general
    await fetchAndDiscard(`${baseUrl}/users/${id}/email?tk=${token}`, ops)

    dispatch(setInfo(true, 'Email succesfully changed'))
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'Current password incorrect', 'error'))
    }
    return false
  }
}

export default editEmail
