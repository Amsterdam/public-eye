import React, { useState } from 'react'
import {
  makeStyles,
  Box,
  TextField,
  Button,
} from '@material-ui/core'
import {
  Add as AddIcon,
} from '@material-ui/icons'
import { useSelectedId } from 'utils'
import CombineCollectionsDialog from './CombineCollectionsDialog'
import CreateDatasetDialog from '../Navigator/Actions/CreateDatasetDialog'
import NewCollectionDialog from './NewCollectionDialog'
import ExportCollectionDialog from './ExportCollectionDialog'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(1),
    borderBottom: '0.5px solid grey',
  },
  button: {
    marginLeft: theme.spacing(0.5),
    marginRight: theme.spacing(0.5),
  },
  search: {
    width: '100%',
  },
}))

const Actions = ({
  selectedFrameIds,
  filter,
  setFilter,
}: {
  selectedFrameIds: number[],
  filter: string,
  setFilter: () => void,
}): JSX.Element => {
  const classes = useStyles()
  // @ts-ignore
  const selectedId = useSelectedId()
  const [combineDialogOpen, setCombineDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [newCollectionOpen, setNewCollectionOpen] = useState(false)

  return (
    <>
      <Box className={classes.root}>
        <Box
          display="flex"
          justifyContent="space-between"
        >
          <Button
            onClick={() => setNewCollectionOpen(true)}
            color="primary"
            variant="contained"
          >
            <AddIcon />
          </Button>
          <CreateDatasetDialog
            // @ts-ignore
            selectedFrameIds={selectedFrameIds}
            disabled={selectedId === null}
          />
          <CombineCollectionsDialog
            // @ts-ignore
            open={combineDialogOpen}
            handleClose={() => setCombineDialogOpen(false)}
          />
          <Button
            className={classes.button}
            color="primary"
            variant="contained"
            disabled={selectedId === null}
            onClick={() => setExportDialogOpen(true)}
          >
            export
          </Button>
        </Box>
        <Box
          paddingTop={2}
        >
          <TextField
            className={classes.search}
            label="filter"
            // @ts-ignore
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
          />
        </Box>
      </Box>
      <ExportCollectionDialog
        open={exportDialogOpen}
        handleClose={() => setExportDialogOpen(false)}
        // @ts-ignore
        collectionId={selectedId}
      />
      <NewCollectionDialog
        open={newCollectionOpen}
        handleClose={() => setNewCollectionOpen(false)}
      />
    </>
  )
}

export default Actions
