import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { StreamArgs } from 'views/DeployView/Navigator/defaultStream'
import { AppThunk } from 'store'

export const castArguments = (args: StreamArgs) => ({
  ...args,
  bias: args.bias && Number(args.bias),
  non_max_suppression: args.non_max_suppression && Number(args.non_max_suppression),
  object_threshold: args.object_threshold && Number(args.object_threshold),
  sliding_window: args.sliding_window ? Number(args.sliding_window) : 1,
  scale_factor: args.scale_factor && Number(args.scale_factor),
  output_scale_factor: args.output_scale_factor ? Number(args.output_scale_factor) : null,
  input_fps: args.input_fps && Number(args.input_fps),
  output_fps: args.output_fps && Number(args.output_fps),
  roi_id: args.roi_id ? Number(args.roi_id) : null,
})

const startStreamCapture = (args: StreamArgs): AppThunk<void> => async (dispatch, getState) => {
  try {
    const body = JSON.stringify({
      scriptName: 'stream_capture.py',
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
    const infoMessage = `Start capturing stream: ${args.stream}`
    dispatch(setInfo(true, infoMessage))
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to start multicapture', 'error'))
    }
  }
}

export default startStreamCapture
