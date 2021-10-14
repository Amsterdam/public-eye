export const DELETE_MODEL = 'DELETE_MODEL'
export type DeleteModel = {
  type: string,
  id: number,
}

const deleteModel = (id: number): DeleteModel => ({
  type: DELETE_MODEL,
  id,
})

export default deleteModel
