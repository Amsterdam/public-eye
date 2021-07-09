export const REMOVE_FRAME = 'REMOVE_FRAME'
export type RemoveFrame = {
  type: string,
  id: number,
  itemId: number,
  itemType: 'video' | 'collection',
}

const removeFrame = (
  id: number, itemId: number, itemType: 'video' | 'collection',
): RemoveFrame => ({
  type: REMOVE_FRAME,
  id,
  itemId,
  itemType,
})

export default removeFrame
