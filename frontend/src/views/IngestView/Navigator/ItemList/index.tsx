import React from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  makeStyles,
  List,
} from '@material-ui/core'
import Pagination, { NUMBER_OF_PAGINATION_ITEMS } from 'common/Pagination'
import EmptyFallbackProgress from 'common/EmptyFallbackProgress'
import { Collection, Video } from 'types'
import { usePage, useFilter } from 'utils'
import ListEntry from './ListEntry'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    height: `calc(100vh - ${theme.spacing(37)}px)`,
    padding: theme.spacing(1),
  },
  frameList: {
    paddingLeft: theme.spacing(2),
  },
  actions: {
    display: 'flex',
  },
  progressContainer: {
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}))

type ItemListProps = {
  items: (Collection | Video)[] | null,
  itemCount: number,
  fetchFunction: (skip: number, limit: number, filter: string) => void,
  type: string,
  setCheckedItems: () => void,
}

const ItemList = (props: ItemListProps): React.ReactElement => {
  const {
    items,
    itemCount,
    type,
    fetchFunction,
    setCheckedItems,
  } = props

  const page = usePage()
  const filter = useFilter()
  const classes = useStyles()
  const history = useHistory()

  React.useEffect(() => {
    setCheckedItems({})
  }, [setCheckedItems])

  const onItemClick = React.useCallback((entry: Video | Collection) => () => {
    setCheckedItems({})
    let url = `/ingest/${type}s/${entry.id}?page=${page}`
    if (filter) {
      url += `&filter=${filter}`
    }
    history.push(url)
  }, [history, setCheckedItems, type, page, filter])

  const handleCheck = React.useCallback(
    (id: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setCheckedItems((ci: Record<string, boolean>) => ({ ...ci, [id]: event.target.checked }))
    }, [setCheckedItems],
  )

  const doubleClickHandler = React.useCallback((entry: Video | Collection) => () => {
    history.push(`/ingest/${type}s/${entry.id}/frames`)
    // setFramesPage(1)
  }, [history, type])

  const createListEntry = (entry: Video | Collection, index: number) => (
    <ListEntry
      key={index}
      type={type}
      entry={entry}
      itemIndex={index}
      onItemClick={onItemClick}
      handleCheck={handleCheck}
      setCheckedItems={setCheckedItems}
      onDoubleClick={doubleClickHandler}
    />
  )

  React.useEffect(() => {
    fetchFunction((page - 1) * NUMBER_OF_PAGINATION_ITEMS, NUMBER_OF_PAGINATION_ITEMS, filter)
  }, [page, fetchFunction, filter])

  const navigate = React.useCallback((value: number) => {
    let url = `/ingest/${type}s?page=${value}`
    if (filter) {
      url += `&filter=${filter}`
    }
    history.push(url)
  }, [history, type, filter])

  return (
    <div>
      <div className={classes.root}>
        <EmptyFallbackProgress
          isEmpty={items === null}
        >
          <List>
            { (items || []).map(createListEntry) }
          </List>
        </EmptyFallbackProgress>
      </div>
      <Pagination
        numberOfItems={itemCount}
        page={page}
        changePage={navigate}
      />
    </div>
  )
}

export default ItemList
