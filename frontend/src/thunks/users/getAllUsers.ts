import { getToken, fetchJson, StatusError } from 'utils'
import setAllUsers from 'actions/users/setAllUsers'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const getAllUsers = (): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const json = await fetchJson(`${baseUrl}/users?tk=${token}`)

    dispatch(setAllUsers(json))
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get users', 'error'))
    }
    console.error(e)
    return false
  }
}

export default getAllUsers
