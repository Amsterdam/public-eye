import { batch } from 'react-redux'
import { getToken, fetchJson, StatusError } from 'utils'
import setDeploys from 'actions/deploys/setDeploys'
import setInfo from 'actions/general/setInfo'
import setPagination from 'actions/pagination/setPagination'
import { AppThunk } from 'store'

const getDeploys = (skip = 0, limit = 25): AppThunk<void> => async (
  dispatch, getState,
) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const result = await fetchJson(`${baseUrl}/deploys?tk=${token}&skip=${skip}&limit=${limit}`)

    const { items, count } = result

    batch(() => {
      dispatch(setDeploys(items))
      dispatch(setPagination('deploys', Number(count)))
    })
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get deploys', 'error'))
    }
  }
}

export default getDeploys
