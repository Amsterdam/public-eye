import { Dataset } from 'types'

export const SET_DATASETS = 'SET_DATASETS'
export type SetDatasets = {
  type: string,
  datasets: Dataset[] | null,
}

const setDatasets = (datasets: Dataset[] | null): SetDatasets => ({
  type: SET_DATASETS,
  datasets,
})

export default setDatasets
