import { getToken, fetchJson } from 'utils'
import { AppThunk } from 'store'

const getClosestPage = (
  id: number,
  limit: number,
  timestamp: number,
): AppThunk<Promise<number | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const url = `${baseUrl}/collections/${id}/frames/closest_page?tk=${token}&timestamp=${timestamp}&limit=${limit}`

    const result = await fetchJson(url)
    return result.page
  } catch (e) {
    console.error(e)
    return null
  }
}

export default getClosestPage
