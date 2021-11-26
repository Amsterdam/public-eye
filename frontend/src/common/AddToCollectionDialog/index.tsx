import React, {
  useState, useCallback, memo,
} from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useDispatch } from 'react-redux'
import { Collection } from 'types'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import addCollectionFrames from 'thunks/frames/addCollectionFrames'
import CollectionSelector from './CollectionSelector'

const useStyles = makeStyles({
  dialogContent: {
    width: 500,
  },
})

const AddToCollectionDialog = ({
  selectedFrameIds,
  handleClose,
  open,
}: {
  selectedFrameIds: number[],
  open: boolean,
  handleClose: () => null,
}) => {
  const classes = useStyles()
  const dispatch = useDispatch()
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)

  const addToCollectionAction = useCallback(() => {
    if (selectedCollection !== null) {
      dispatch(addCollectionFrames(
        selectedCollection.id, selectedCollection.name, selectedFrameIds,
      ))
      handleClose()
    }
  }, [selectedCollection, selectedFrameIds, dispatch, handleClose])

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
      >
        <DialogTitle>
          { `Add (${selectedFrameIds.length}) files to collection` }
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          {
            setSelectedCollection !== null
            && (
              <CollectionSelector
                handleChange={setSelectedCollection}
                selectedCollection={selectedCollection as Collection}
              />
            )
          }
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            onClick={handleClose}
          >
            cancel
          </Button>
          <Button
            color="primary"
            disabled={!selectedCollection}
            onClick={addToCollectionAction}
          >
            add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default memo(AddToCollectionDialog)
