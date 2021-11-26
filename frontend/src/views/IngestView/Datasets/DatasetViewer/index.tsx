import React, { useMemo, useState, useEffect } from 'react'
import { useThunkDispatch } from 'store'
import { useHistory } from 'react-router-dom'
import {
  Box,
  Fab,
  makeStyles,
} from '@material-ui/core'
import { Dataset } from 'types'
import { useSelectedId } from 'utils'
import CancelIcon from '@material-ui/icons/CancelOutlined'
import deleteDataset from 'thunks/datasets/deleteDatasetById'
import getDatasetById from 'thunks/datasets/getDatasetById'
import AlertDialog from 'common/AlertDialog'
import DensityDataset from './DensityDataset'
import ObjectDataset from './ObjectDataset'
import LoiDataset from './LoiDataset'

const useStyles = makeStyles(() => ({
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 40,
  },
}))

const useDatasetType = (datasetId: string | null): string | null => {
  const dispatch = useThunkDispatch()
  const [idToNNType, setIdToNNType] = useState<Record<string, string>>({})

  useEffect(() => {
    if (datasetId === null) {
      return
    }

    // @ts-ignore
    dispatch(getDatasetById(datasetId))
      // @ts-ignore
      .then((dataset: Dataset) => {
        if (dataset) {
          setIdToNNType((old) => ({ ...old, [datasetId]: dataset.nn_type }))
        }
      })
  }, [datasetId, dispatch])

  return datasetId && idToNNType[datasetId]
}

const DatasetViewer = (): React.ReactElement => {
  const classes = useStyles()
  const history = useHistory()
  const dispatch = useThunkDispatch()
  const selectedId = useSelectedId(['/ingest/datasets/:id'])
  const nnType = useDatasetType(selectedId)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const dataset = useMemo(() => {
    if (nnType === 'density_estimation') {
      return <DensityDataset />
    }
    if (nnType === 'object_recognition') {
      return <ObjectDataset />
    }
    if (nnType === 'line_crossing_density') {
      return <LoiDataset />
    }
    return ''
  }, [nnType])

  const commitDelete = React.useCallback(() => {
    dispatch(deleteDataset(Number(selectedId)))
      .then((success: boolean) => {
        if (success) {
          history.push('/ingest/datasets')
        }
      })
  }, [dispatch, selectedId, history])

  return (
    <>
      <Box
        display="flex"
        width="100%"
        flexDirection="column"
        alignItems="center"
      >
        {dataset}
      </Box>
      <Fab
        className={classes.fab}
        color="secondary"
        variant="extended"
        disabled={selectedId === null}
        onClick={() => setDeleteDialogOpen(true)}
      >
        <CancelIcon />
        delete
      </Fab>
      <AlertDialog
        open={deleteDialogOpen}
        handleClose={() => setDeleteDialogOpen(false)}
        title="Delete dataset"
        submitFunction={commitDelete}
      />
    </>
  )
}

export default DatasetViewer
