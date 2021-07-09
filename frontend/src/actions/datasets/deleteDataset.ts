export const DELETE_DATASET = 'DELETE_DATASET'
export type DeleteDataset = {
  type: string,
  id: number,
}

const deleteDataset = (id: number): DeleteDataset => ({
  type: DELETE_DATASET,
  id,
})

export default deleteDataset
