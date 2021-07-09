import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const upload = (
  location: string,
  files: string[],
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const formData = new FormData()
    formData.append('file', files[0])
    const ops = {
      method: 'POST',
      body: formData,
    }
    const token = getToken()
    const { baseUrl } = getState().general
    await fetchAndDiscard(`${baseUrl}/files/${location}/upload?tk=${token}`, ops)
    dispatch(setInfo(true, 'Video has been uploaded succesfully.'))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to upload video', 'error'))
    }
  }
}

export default upload
