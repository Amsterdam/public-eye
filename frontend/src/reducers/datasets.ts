import { SET_DATASETS, SetDatasets } from 'actions/datasets/setDatasets'
import { ADD_DATASET, AddDataset } from 'actions/datasets/addDataset'
import { DELETE_DATASET, DeleteDataset } from 'actions/datasets/deleteDataset'
import { Dataset } from 'types'

type ReducerState = Dataset[] | null

type ReducerAction = (
  SetDatasets
  | AddDataset
  | DeleteDataset
)

const defaultState: ReducerState = null

const addDataset = (
  state: ReducerState,
  action: AddDataset,
): ReducerState => (
  state
    ? [...state, action.dataset]
    : state
)

const deleteDataset = (
  state: ReducerState,
  action: DeleteDataset,
): ReducerState => (
  state
    ? state.filter(({ id }) => action.id !== id)
    : state
)

const reducer = (state: ReducerState = defaultState, action: ReducerAction) => {
  switch (action.type) {
    case ADD_DATASET:
      return addDataset(state, action as AddDataset)
    case SET_DATASETS:
      return (action as SetDatasets).datasets
    case DELETE_DATASET:
      return deleteDataset(state, action as DeleteDataset)
    default:
      return state
  }
}

export default reducer
