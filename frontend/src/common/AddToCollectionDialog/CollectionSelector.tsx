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
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
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

const CollectionSelector = (props: CollectionSelectorProps): React.ReactNode => {
  const {
    handleChange,
    selectedCollection,
  } = props

  const collections = useCollections()

  return (
    <FormControl>
      <InputLabel> Collection </InputLabel>
      <Select
        value={selectedCollection || ''}
        onChange={handleChange}
      >
        {
          (collections || []).map((collection) => (
            <MenuItem key={collection.name} value={collection}>
              { collection.name }
            </MenuItem>
          ))
        }
      </Select>
    </FormControl>
  )
}

export default CollectionSelector
