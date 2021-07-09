import { getToken, fetchJson, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { NeuralNetwork } from 'types'

const getNeuralNetworks = (): AppThunk<Promise<NeuralNetwork[] | null>> => async (
  dispatch,
  getState,
) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const result = await fetchJson(`${baseUrl}/neural_networks?tk=${token}`)
    return result
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to get neural networks', 'error'))
    }
    return null
  }
}

export default getNeuralNetworks
