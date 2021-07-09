import { Collection } from 'types'

export const SET_COLLECTIONS = 'SET_COLLECTIONS'
export type SetCollection = {
  type: string,
  collections: Collection[],
}

const setCollections = (collections: Collection[]): SetCollection => ({
  type: SET_COLLECTIONS,
  collections,
})

export default setCollections
