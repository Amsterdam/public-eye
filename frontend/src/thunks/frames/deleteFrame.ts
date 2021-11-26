import { getToken, fetchAndDiscard, StatusError } from 'utils'
import { batch } from 'react-redux'
import setInfo from 'actions/general/setInfo'
import deleteFrameAction from 'actions/ingest/removeFrame'
import updateFrameCountAction from 'actions/ingest/updateFrameCount'
import deleteNavigatorFrame from 'actions/navigator/deleteNavigatorFrame'
import { AppThunk } from 'store'

const deleteFrame = (
  frameId: number,
  itemId: number,
  itemType: string,
): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
  try {
    const token = getToken()
    const { baseUrl } = getState().general
    const ops = {
      method: 'DELETE',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
    }

    await fetchAndDiscard(`${baseUrl}/frames/${frameId}?tk=${token}`, ops)
    batch(() => {
      dispatch(deleteFrameAction(frameId, itemId, itemType as 'video' | 'collection'))
      dispatch(updateFrameCountAction(
        itemId,
        itemType,
        (x: number | string) => String(Number(x) - 1),
      ))
      dispatch(setInfo(true, 'Frame succesfully deleted.'))
      dispatch(deleteNavigatorFrame(frameId))
    })

    return true
  } catch (e) {
    if ((e as StatusError).status === 409) {
      dispatch(setInfo(true, 'Frame cannot be deleted because it is part of a dataset.'))
    } else if ((e as StatusError).status === 401) {
      dispatch(setInfo(true, 'You are not authorized to delete frame', 'error'))
    }
    return false
  }
}

export default deleteFrame
