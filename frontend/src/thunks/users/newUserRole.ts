import { getToken } from 'utils'
import { AppThunk } from 'store'

const newUserRole = (
  userId: number,
  roleId: number,
): AppThunk<Promise<boolean>> => async (
  dispatch, getState,
): Promise<boolean> => {
  try {
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    }
    const token = getToken()
    const { baseUrl } = getState().general
    const response = await fetch(`${baseUrl}/users/${userId}/roles/${roleId}?tk=${token}`, ops)
    if (response.ok) {
      return true
    }
    return false
  } catch (e) {
    return false
  }
}

export default newUserRole
