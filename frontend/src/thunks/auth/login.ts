import { setToken, fetchJson } from 'utils'
import { AppThunk } from 'store'

const login = (
  email: string,
  password: string,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
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
    const { baseUrl } = getState().general
    const json = await fetchJson(`${baseUrl}/users/auth`, ops)
    setToken(json.token as string)
    return json.token
  } catch (e) {
    return null
  }
}

export default login
