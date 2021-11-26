// @ts-nocheck
import React from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Divider from '@material-ui/core/Divider'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import getAllModels from 'thunks/training/getAllModels'
import exportModel from 'thunks/training/exportModelByModelId'
import { useSelectedId, usePage, useFilter } from 'utils'
import { RootState } from 'reducers'
import SideBar from 'common/SideBar'
import Pagination, { NUMBER_OF_PAGINATION_ITEMS } from 'common/Pagination'
import EmptyFallbackProgress from 'common/EmptyFallbackProgress'
import NavigationTabs from '../Navigator/NavigationTabs'
import UploadModelDialog from './UploadModelDialog'

const useStyles = makeStyles((theme) => ({
  filterContainer: {
    borderBottom: '1px solid',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(1),
  },
  searchField: {
  },
  list: {
    overflowY: 'auto',
    height: `calc(100vh - ${theme.spacing(38)}px)`,
  },
}))

const ModelNavigator = () => {
  const page = usePage()
  const filter = useFilter()
  const selectedId = useSelectedId(['/train/models/:id'])
  const models = useSelector((state: RootState) => state.training.models)
  const itemCount = useSelector((state: RootState) => state.pagination.models.total)
  const history = useHistory()
  const dispatch = useDispatch()
  const classes = useStyles()
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)

  React.useEffect(() => {
    if (filter !== null) {
      dispatch(getAllModels(0, NUMBER_OF_PAGINATION_ITEMS, filter))
    } else {
      dispatch(getAllModels(0, NUMBER_OF_PAGINATION_ITEMS, ''))
    }
  }, [dispatch, filter])

  React.useEffect(() => {
    dispatch(getAllModels((page - 1) * NUMBER_OF_PAGINATION_ITEMS, NUMBER_OF_PAGINATION_ITEMS))
  }, [page, dispatch])

  const commitExport = React.useCallback(() => {
    dispatch(exportModel(Number(selectedId)))
  }, [dispatch, selectedId])

  const navigate = React.useCallback((newPage: number) => {
    history.push(`/train/models${selectedId ? `/${selectedId}` : ''}?page=${newPage}`)
  }, [selectedId, history])

  const buildUrl = React.useCallback((
    newPage: number,
    newFilter: string | null,
    newSelectedId: number | null,
  ): string => {
    let url = '/train/models'

    if (newSelectedId) {
      url += `/${newSelectedId}`
    }

    url += `?page=${newPage}`

    if (newFilter) {
      url += `&filter=${newFilter}`
    }

    return url
  }, [])

  const changeFilter = React.useCallback((newFilter: string) => {
    history.push(buildUrl(1, newFilter, selectedId))
  }, [selectedId, history, buildUrl])

  return (
    <>
      <SideBar>
        <Box
          display="flex"
          borderBottom="1px solid"
          padding={1}
          justifyContent="space-between"
        >
          <Button
            color="primary"
            variant="contained"
            onClick={() => setUploadDialogOpen(true)}
          >
            upload model
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={!selectedId}
            onClick={commitExport}
          >
            export
          </Button>
        </Box>
        <NavigationTabs />
        <div className={classes.filterContainer}>
          <TextField
            onChange={(e) => changeFilter(e.target.value)}
            margin="dense"
            variant="outlined"
            placeholder="search"
            className={classes.searchField}
          />
        </div>
        <List className={classes.list}>
          <EmptyFallbackProgress
            isEmpty={models === null}
          >
            {
              models !== null
              && (
                Array.from(models.values()).map((model) => (
                  <div key={model.id}>
                    <ListItem
                      selected={selectedId && Number(selectedId) === model.id}
                      button
                      onClick={() => history.push(buildUrl(page, filter, model.id))}
                    >
                      <ListItemText>
                        {model.name}
                      </ListItemText>
                    </ListItem>
                    <Divider />
                  </div>
                ))
              )
            }
          </EmptyFallbackProgress>
        </List>
        <Pagination
          page={page}
          numberOfItems={itemCount}
          changePage={navigate}
        />
      </SideBar>
      <UploadModelDialog
        open={uploadDialogOpen}
        handleClose={() => setUploadDialogOpen(false)}
      />
    </>
  )
}

export default React.memo(ModelNavigator)
