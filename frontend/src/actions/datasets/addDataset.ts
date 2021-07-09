import { Dataset } from 'types'

export const ADD_DATASET = 'ADD_DATASET'
export type AddDataset = {
  type: string,
  dataset: Dataset,
}

const addDataset = (dataset: Dataset): AddDataset => ({
  type: ADD_DATASET,
  dataset,
})

export default addDataset
