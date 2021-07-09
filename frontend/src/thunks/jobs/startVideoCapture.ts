import { fetchAndDiscard, getToken, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'

type Args = {
  scale_factor: string,
  output_scale_factor: string,
  input_fps: string,
  output_fps: string,
  stream: string,
}

const castArguments = (args: Args) => ({
  ...args,
  scale_factor: args.scale_factor && Number(args.scale_factor),
  output_scale_factor: args.output_scale_factor ? Number(args.output_scale_factor) : null,
  input_fps: args.input_fps && Number(args.input_fps),
  output_fps: args.output_fps && Number(args.output_fps),
})

const startStreamCapture = (args: Args): AppThunk<void> => async (dispatch, getState) => {
  try {
    const body = JSON.stringify({
      scriptName: 'capture_camera.py',
      scriptArgs: castArguments(args),
    })
    const ops = {
      method: 'POST',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body,
    }
    const token = getToken()
    const { baseUrl } = getState().general
    await fetchAndDiscard(`${baseUrl}/jobs?tk=${token}`, ops)
    const infoMessage = `Start capturing camera: ${args.stream}`
    dispatch(setInfo(true, infoMessage))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to start capture', 'error'))
    }
  }
}

export default startStreamCapture
