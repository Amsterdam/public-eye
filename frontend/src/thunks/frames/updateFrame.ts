import { batch } from 'react-redux'
import { getToken, fetchJson, StatusError } from 'utils'
import updateFrame from 'actions/ingest/updateFrame'
import updateNavigatorFrame from 'actions/navigator/updateNavigatorFrame'
import setOrAddFrame from 'actions/frames/setOrAddFrame'
import setInfo from 'actions/general/setInfo'
import { Frame } from 'types'
import { AppThunk } from 'store'

const commitUpdateFrame = (
  frameId: number,
  data: Frame,
  itemId: number | undefined,
  itemType: string,
  lockCountChangeFunc = (x: number): number => x,
): AppThunk<Promise<boolean | null>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general

    const ops = {
      method: 'PUT',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(data),
    }

    const url = `${baseUrl}/frames/${frameId}?tk=${token}`
    const json = await fetchJson(url, ops)
    const newFrame = { ...json, item_id: itemId, type: itemType }

    batch(() => {
      dispatch(updateFrame(newFrame, itemId, itemType, lockCountChangeFunc))
      dispatch(updateNavigatorFrame(newFrame))
      dispatch(setOrAddFrame(newFrame))
    })

    return true
  } catch (e) {
    if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to update frame', 'error'))
    }
    return null
  }
}

export default commitUpdateFrame
