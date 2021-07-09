export const UPDATE_FRAME_COUNT = 'UPDATE_FRAME_COUNT'
export type UpdateFrameCount = {
  type: string,
  itemId: number,
  itemType: string,
  func: () => void,
}

const updateFrameCount = (
  itemId: number, itemType: string, func: () => void,
): UpdateFrameCount => ({
  type: UPDATE_FRAME_COUNT,
  itemId,
  itemType,
  func,
})

export default updateFrameCount
