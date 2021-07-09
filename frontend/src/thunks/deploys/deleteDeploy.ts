import { getToken, fetchAndDiscard, StatusError } from 'utils'
import { batch } from 'react-redux'
import setInfo from 'actions/general/setInfo'
import deleteDeployAction from 'actions/deploys/deleteDeploy'
import { AppThunk } from 'store'
import { Deploy } from 'types'

const deleteDeploy = (
  deploy: Deploy,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const ops = {
      method: 'DELETE',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    }

    await fetchAndDiscard(`${baseUrl}/deploys/${deploy.id}?tk=${token}`, ops)

    batch(() => {
      dispatch(setInfo(true, 'Deploy deleted'))
      dispatch(deleteDeployAction(deploy.id))
    })
    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete deploy', 'error'))
    }
    console.error('error', e)
    return false
  }
}

export default deleteDeploy
