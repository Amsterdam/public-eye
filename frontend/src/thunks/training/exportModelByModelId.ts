import { getToken, fetchAndDiscard } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const exportModel = (
  id: number,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/neural_networks/models/${id}/export?tk=${token}`

    await fetchAndDiscard(url, {})
    window.location.href = url
  } catch (e) {
    dispatch(setInfo(true, 'Something went wrong downloading model.', 'error'))
  }
}

export default exportModel
