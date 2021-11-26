import React, { useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import { useSelectedId, usePage } from 'utils'
import List from '@material-ui/core/List'
import Pagination, { NUMBER_OF_PAGINATION_ITEMS } from 'common/Pagination'
import EmptyFallBackProgress from 'common/EmptyFallbackProgress'
import getDatasets from 'thunks/datasets/getDatasets'
import { RootState } from 'reducers'
import { Dataset } from 'types'
import DatasetListItem from './DatasetListItem'

const useStyles = makeStyles((theme) => ({
  list: {
    overflow: 'auto',
    height: `calc(100vh - ${theme.spacing(23)}px)`,
  },
}))

const DatasetList = (): React.ReactElement => {
  const page = usePage()
  const datasets = useSelector((state: RootState) => state.datasets)
  const dispatch = useThunkDispatch()
  const history = useHistory()
  const classes = useStyles()
  const itemsCount = useSelector(
    (state: RootState) => state.pagination.datasets.total,
  )

  const selectedId = useSelectedId(['/ingest/datasets/:id'])

  React.useEffect(() => {
    // @ts-ignore
    dispatch(getDatasets((page - 1) * NUMBER_OF_PAGINATION_ITEMS, NUMBER_OF_PAGINATION_ITEMS))
  }, [page, dispatch])

  const onSetDatasetSelected = useCallback((ds: Dataset) => () => {
    history.push(`/ingest/datasets/${ds.id}?page=${page}`)
  }, [history, page])

  const createListItem = useCallback(({ name, id, nn_type: nnType }: Dataset) => (
    <DatasetListItem
      key={id}
      datasetId={id}
      index={id}
      name={name}
      nnType={nnType}
      // @ts-ignore
      onClick={onSetDatasetSelected({ id, nn_type: nnType })}
      // @ts-ignore
      selectedId={selectedId}
    />
  ), [onSetDatasetSelected, selectedId])

  const navigate = React.useCallback((newPage: number) => {
    history.push(`/ingest/datasets${selectedId ? `/${selectedId}` : ''}?page=${newPage}`)
  }, [history, selectedId])

  return (
    <div>
      <List className={classes.list}>
        <EmptyFallBackProgress
          isEmpty={datasets === null}
        >
          {/* @ts-ignore */}
          { (datasets || []).map(createListItem) }
        </EmptyFallBackProgress>
      </List>
      <Pagination
        numberOfItems={itemsCount}
        page={page}
        changePage={navigate}
      />
    </div>
  )
}

export default DatasetList
