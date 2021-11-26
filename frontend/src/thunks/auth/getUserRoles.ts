import { getToken, fetchJson } from 'utils'
import setUserRoles from 'actions/users/setUserRoles'
import { AppThunk } from 'store'

const getUserRoles = (
  tokenArgument: string | null = null,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const { baseUrl } = getState().general
    const token = tokenArgument || getToken()
    const json = await fetchJson(`${baseUrl}/users/user_by_token?tk=${token}`)
    dispatch(setUserRoles(json.roles as string[]))
    return null
  } catch (e) {
    return null
  }
}

export default getUserRoles
