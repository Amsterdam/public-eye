import { ModelTag } from 'types'

export const ADD_MODEL_TAG = 'ADD_MODEL_TAG'
export type AddModelTag = {
  type: string,
  modelTag: ModelTag,
}

const addModelTag = (modelTag: ModelTag): AddModelTag => ({
  type: ADD_MODEL_TAG,
  modelTag,
})

export default addModelTag
