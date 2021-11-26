// @ts-nocheck
import React, {
  useState, useMemo, memo, useCallback,
} from 'react'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'
import Paper from '@material-ui/core/Paper'
import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import AddIcon from '@material-ui/icons/Add'
import TextField from '@material-ui/core/TextField'
import AddToCollectionDialog from 'common/AddToCollectionDialog'
import upload from 'thunks/staticFiles/upload'
import FileInputButton from 'common/FileInputButton'
import NewCollectionDialog from 'views/IngestView/Collections/NewCollectionDialog'
import CombineCollectionsDialog from 'views/IngestView/Collections/CombineCollectionsDialog'
import ExportCollectionDialog from 'views/IngestView/Collections/ExportCollectionDialog'
import { useIngestPath } from 'utils'
import CreateDatasetDialog from './CreateDatasetDialog'

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
  },
  button: {
    marginLeft: theme.spacing(0.5),
    marginRight: theme.spacing(0.5),
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  search: {
    marginTop: theme.spacing(1),
    width: '100%',
    // margin: theme.spacing(1),
  },
}))

type ActionProps = {
  type: string,
  checkedItems: Record<string, unknown>,
  filter: string,
  setFilter: () => null,
}

const Actions = (props: ActionProps) => {
  const {
    type,
    checkedItems,
    filter,
    setFilter,
  } = props

  const classes = useStyles()
  const dispatch = useDispatch()
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false)
  const [combineDialogOpen, setCombineDialogOpen] = useState(false)
  const [addToCollectionOpen, setAddtoCollectionOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [createDatasetOpen, setCreateDatasetOpen] = useState(false)
  const { id } = useIngestPath()

  const submitFile = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => dispatch(upload('videos', e.target.files)),
    [dispatch],
  )

  const addButton = useMemo(() => {
    if (type === 'video') {
      return (
        <FileInputButton submitFile={submitFile}>
          <AddIcon />
        </FileInputButton>
      )
    }
    if (type === 'collection') {
      return (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setCollectionDialogOpen(true)}
        >
          <AddIcon />
        </Button>
      )
    }
    return null
  }, [setCollectionDialogOpen, type, submitFile])

  const selectedFrameIds = Object.keys(checkedItems)
    .filter((frameId) => checkedItems[frameId])

  return (
    <>
      <Paper className={classes.paper}>
        <div className={classes.headerRow}>
          { addButton }
          {
            type === 'collection'
            && (
              <CombineCollectionsDialog
                open={combineDialogOpen}
                handleClose={() => setCombineDialogOpen(false)}
              />
            )
          }
          {
            type === 'collection'
            && (
              <Button
                className={classes.button}
                color="primary"
                variant="contained"
                onClick={() => setExportDialogOpen(true)}
              >
                export
              </Button>
            )
          }
          <CreateDatasetDialog
            open={createDatasetOpen}
            handleClose={() => setCreateDatasetOpen(false)}
            disabled={selectedFrameIds.length === 0}
            selectedFrameIds={selectedFrameIds}
          />
          {
            type === 'video'
            && (
              <Button
                className={classes.button}
                color="primary"
                variant="contained"
                disabled={selectedFrameIds.length === 0}
                onClick={() => setAddtoCollectionOpen(true)}
              >
                add to collection
              </Button>
            )
          }
        </div>
        <div>
          <TextField
            className={classes.search}
            label="filter"
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
          />
        </div>
      </Paper>
      <NewCollectionDialog
        open={collectionDialogOpen}
        handleClose={() => setCollectionDialogOpen(false)}
      />
      <ExportCollectionDialog
        open={exportDialogOpen}
        handleClose={() => setExportDialogOpen(false)}
        collectionId={id ? Number(id) : null}
      />
      <AddToCollectionDialog
        open={addToCollectionOpen}
        handleClose={() => setAddtoCollectionOpen(false)}
        selectedFrameIds={selectedFrameIds}
        disabled={selectedFrameIds.length === 0}
      />
    </>
  )
}

const areEqual = (prevProps: ActionProps, nextProps: ActionProps) => {
  if (!R.equals(prevProps.type, nextProps.type)) {
    return false
  }
  if (R.equals(prevProps.checkedItems, nextProps.checkedItems)) {
    return false
  }
  return false
}

export default memo(Actions, areEqual)
