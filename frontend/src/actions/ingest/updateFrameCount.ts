export const UPDATE_FRAME_COUNT = 'UPDATE_FRAME_COUNT'
export type UpdateFrameCount = {
  type: string,
  itemId: number,
  itemType: string,
  func: (x: number | string) => string,
}

const updateFrameCount = (
  itemId: number, itemType: string, func: (x: number | string) => string,
): UpdateFrameCount => ({
  type: UPDATE_FRAME_COUNT,
  itemId,
  itemType,
  func,
})

export default updateFrameCount
