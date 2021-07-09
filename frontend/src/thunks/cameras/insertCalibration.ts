import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

const insertCalibration = (
  cameraId: number,
  a: number,
  b: number,
  c: number,
  d: number,
  scalingFactor: number,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        a,
        b,
        c,
        d,
        scaling_factor: scalingFactor,
      }),
    }

    const token = getToken()
    const { baseUrl } = getState().general
    await fetchAndDiscard(`${baseUrl}/cameras/${cameraId}/calibration?tk=${token}`, ops)
    dispatch(setInfo(true, 'Succesfuly calibrated streaming instance'))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to insert callibration', 'error'))
    }
    console.error(e)
  }
}

export default insertCalibration
