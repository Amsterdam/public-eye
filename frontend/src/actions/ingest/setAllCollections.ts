import { Collection } from 'types'

export const SET_ALL_COLLECTIONS = 'SET_ALL_COLLECTIONS'
export type SetAllCollections = {
  type: string,
  collections: Collection[],
}

const setAllCollections = (collections: Collection[]): SetAllCollections => ({
  type: SET_ALL_COLLECTIONS,
  collections,
})

export default setAllCollections
