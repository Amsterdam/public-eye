import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const exportCollection = (
  collectionId: number,
  dataType: string,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/collections/${collectionId}/export_${dataType}?tk=${token}`
    await fetchAndDiscard(url, {})
    window.location.href = url
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to export collection', 'error'))
    } else {
      dispatch(setInfo(true, 'Something went wrong exporting collection.', 'error'))
    }
  }
}

export default exportCollection
