import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { UserRole } from 'types'

const getAllRoles = (): AppThunk<Promise<UserRole[]>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const json = await fetchJson(`${baseUrl}/users/roles?tk=${token}`)
    return json
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get user roles', 'error'))
    }
    console.error(e)
    return null
  }
}

export default getAllRoles
