import { getToken, fetchAndDiscard } from 'utils'
import setInfo from 'actions/setInfo'

const editEmail = (id, email, currentPassword) => async (dispatch, getState) => {
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

    dispatch(setInfo(true, "Email succesfully changed"))
    return true
  } catch (e) {
    if (e.status === 401) {
      dispatch(setInfo(true, "Current password incorrect", 'error'))
    }
    console.error(e)
    return false
  }
}

export default editEmail