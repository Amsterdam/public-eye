import { Model } from 'types'

export const SET_MODELS = 'SET_MODELS'
export type SetModels = {
  type: string,
  models: Model[],
}

const setModels = (models: Model[]): SetModels => ({
  type: SET_MODELS,
  models,
})

export default setModels
