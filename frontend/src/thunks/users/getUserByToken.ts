import { getToken, fetchJson } from 'utils'
import { AppThunk } from 'store'
import { User } from 'types'

const getUserByToken = (
  tokenArgument = null,
): AppThunk<Promise<User | null>> => async (dispatch, getState) => {
  try {
    const { baseUrl } = getState().general
    const token = tokenArgument || getToken()
    const json = await fetchJson(`${baseUrl}/users/user_by_token?tk=${token}`)
    return json
  } catch (e) {
    console.error(e)
    return null
  }
}

export default getUserByToken
