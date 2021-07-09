import React from 'react'
import { useDispatch } from 'react-redux'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import deleteCollection from 'thunks/collections/deleteCollection'
import { VoidFunction } from 'types'

type DeleteCollectionDialogProps = {
  open: boolean,
  handleClose: VoidFunction,
  id: number,
}

const DeleteCollectionDialog = (props: DeleteCollectionDialogProps): React.ReactElement => {
  const {
    open,
    handleClose,
    id,
  } = props

  const dispatch = useDispatch()

  const commitDelete = () => {
    dispatch(deleteCollection(id))
    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>
        Delete collection
      </DialogTitle>
      <DialogActions>
        <Button
          color="primary"
          onClick={handleClose}
        >
          close
        </Button>
        <Button
          color="primary"
          onClick={commitDelete}
        >
          submit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteCollectionDialog
