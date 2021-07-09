export const DELETE_CAMERA = 'DELETE_CAMERA'
export type DeleteCamera = {
  type: string,
  id: number,
}

const deleteCamera = (id: number): DeleteCamera => ({
  type: DELETE_CAMERA,
  id,
})

export default deleteCamera
