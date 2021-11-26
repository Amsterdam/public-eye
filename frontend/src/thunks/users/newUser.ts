import { getToken, fetchJson } from 'utils'
import setInfo from 'actions/general/setInfo'
import addUser from 'actions/users/addUser'
import { AppThunk } from 'store'
import { User } from 'types'

const newUser = (
  email: string,
  password: string,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const ops = {
      method: 'POST',
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
    const json = await fetchJson(`${baseUrl}/users?tk=${token}`, ops)
    const infoMessage = `user added with email: ${email}`
    dispatch(setInfo(true, infoMessage))
    dispatch(addUser({ ...json, roles: [] } as unknown as User))
    return true
  } catch (e) {
    return false
  }
}

export default newUser
