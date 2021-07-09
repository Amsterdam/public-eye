export const DELETE_NAVIGATOR_FRAME = 'DELETE_NAVIGATOR_FRAME'
export type DeleteNavigatorFrame = {
  frameId: number,
  type: string,
}

const deleteNavigatorFrame = (frameId: number): DeleteNavigatorFrame => ({
  type: DELETE_NAVIGATOR_FRAME,
  frameId,
})

export default deleteNavigatorFrame
