import Papa from 'papaparse'
import { getToken } from 'utils'
import setChartData from 'actions/training/setChartData'
import { AppThunk } from 'store'

const getTrainingLogs = (
  runId: number,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const response = await fetch(`${baseUrl}/files/training_logs/${runId}?tk=${token}`)
    const result = await response.text()

    const parsed = Papa.parse(
      result, { header: true, dynamicTyping: true },
    )
    const parsedCsv = parsed.data

    dispatch(setChartData(parsedCsv))
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export default getTrainingLogs
