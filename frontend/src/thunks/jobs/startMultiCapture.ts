import { getToken, fetchAndDiscard, StatusError } from 'utils'
import setInfo from 'actions/general/setInfo'
import { AppThunk } from 'store'
import { StreamArgs } from 'views/DeployView/Navigator/defaultStream'
import { castArguments } from './startStreamCapture'

const startMultiCapture = (
  args: StreamArgs[],
  name: string,
): AppThunk<void> => async (dispatch, getState) => {
  try {
    const body = JSON.stringify({
      scriptName: 'stream_multicapture.py',
      scriptArgs: {
        args: args.map(castArguments),
        name,
      },
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
    setInfo(true, 'Started multicapture streaming')
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to start multicapture', 'error'))
    }
  }
}

export default startMultiCapture
