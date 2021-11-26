import React, { useEffect } from 'react'
import { useThunkDispatch } from 'store'
import { useSelector } from 'react-redux'
import { Collection } from 'types'
import { RootState } from 'reducers'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import getAllCollections from 'thunks/collections/getAllCollections'

type CollectionSelectorProps = {
  handleChange: React.Dispatch<React.SetStateAction<Collection | null>>,
  selectedCollection: Collection,
}

const useCollections = (): Collection[] | null => {
  const dispatch = useThunkDispatch()
  const collections = useSelector((state: RootState) => state.ingest.allCollections)

  useEffect(() => {
    if (collections === null) {
      dispatch(getAllCollections())
    }
  }, [collections, dispatch])

  return collections
}

const useCollectionMap = (
  collections: Collection[] | null,
): Record<number, Collection> => React.useMemo(() => {
  if (collections === null) {
    return {}
  }

  const collectionMap: Record<number, Collection> = {}
  collections.forEach((collection) => {
    collectionMap[collection.id] = collection
  })

  return collectionMap
}, [collections])

const CollectionSelector = (props: CollectionSelectorProps): JSX.Element => {
  const {
    handleChange,
    selectedCollection,
  } = props

  const collections = useCollections()
  const collectionMap = useCollectionMap(collections)

  const commitChange = React.useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    const collectionId = Number(event.target.value)
    const collection = collectionMap[collectionId]
    handleChange(collection)
  }, [collectionMap, handleChange])

  return (
    <FormControl>
      <InputLabel> Collection </InputLabel>
      <Select
        value={selectedCollection || ''}
        onChange={commitChange}
      >
        {
          (collections || []).map((collection) => (
            <MenuItem
              key={collection.name}
              value={collection.id}
            >
              { collection.name }
            </MenuItem>
          ))
        }
      </Select>
    </FormControl>
  )
}

export default CollectionSelector
