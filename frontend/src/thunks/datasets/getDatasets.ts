import { batch } from 'react-redux'
import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import setPagination from 'actions/pagination/setPagination'
import setDatasets from 'actions/datasets/setDatasets'
import { AppThunk } from 'store'
import { Dataset } from 'types'

const getDatasets = (
  skip: number,
  limit: number,
  nnType: string,
): AppThunk<Promise<unknown>> => async (dispatch, getState) => {
  try {
    dispatch(setDatasets(null))
    const token = getToken()
    const { baseUrl } = getState().general

    let url = `${baseUrl}/datasets?tk=${token}`
    if (skip !== null && skip !== undefined) {
      url += `&skip=${skip}`
    }
    if (skip !== null && skip !== undefined) {
      url += `&limit=${limit}`
    }
    if (nnType) {
      url += `&nn_type=${nnType}`
    }
    const json = await fetchJson(url)

    const { items, count } = json

    batch(() => {
      dispatch(setPagination('datasets', Number(count)))
      dispatch(setDatasets(items as Dataset[]))
    })
    return items
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get datasets', 'error'))
    }
    return null
  }
}

export default getDatasets
