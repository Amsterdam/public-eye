import { batch } from 'react-redux'
import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import setPagination from 'actions/pagination/setPagination'
import setModels from 'actions/training/setModels'
import { AppThunk } from 'store'
import { Model } from 'types'

let controller = new AbortController()

const getAllModels = (
  skip = 0,
  limit = 25,
  query?: string,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
  try {
    controller.abort()
    controller = new AbortController()

    dispatch(setModels([]))
    const token = getToken()
    const { baseUrl } = getState().general

    let url = `${baseUrl}/neural_networks/models?tk=${token}&skip=${skip}&limit=${limit}`
    if (query) {
      url += `&query=${query}`
    }

    const result = await fetchJson(url, { signal: controller.signal })
    const { items, count } = result

    batch(() => {
      dispatch(setModels(items as Model[]))
      dispatch(setPagination('models', Number(count)))
    })

    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get all models', 'error'))
    }
    return null
  }
}

export default getAllModels
