import { getToken } from 'utils'

const getRois = (id) => {
  return async (dispatch, getState) => {
    try {
      const token = getToken()
      const { baseUrl } = getState().general
      const response = await fetch(`${baseUrl}/stream_capture/${id}/loi?tk=${token}`)
      const result = await response.json()
      return result
    } catch (e) {
      console.error(e)
      return null
    }
  }
}

export default getRois
