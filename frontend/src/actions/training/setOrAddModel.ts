import { Model } from 'types'

export const SET_OR_ADD_MODEL = 'SET_OR_ADD_MODEL'
export type SetOrAddModel = {
  type: string,
  model: Model,
}

const setOrAddModel = (model: Model): SetOrAddModel => ({
  type: SET_OR_ADD_MODEL,
  model,
})

export default setOrAddModel
