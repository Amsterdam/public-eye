import { ModelTag } from 'types'

export const SET_MODEL_TAGS = 'SET_MODEL_TAGS'
export type SetModelTags = {
  type: string,
  modelTags: ModelTag[],
}

const setModelTags = (modelTags: ModelTag[]): SetModelTags => ({
  type: SET_MODEL_TAGS,
  modelTags,
})

export default setModelTags
