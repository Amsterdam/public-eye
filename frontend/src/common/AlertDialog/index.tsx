import React from 'react'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogTitle from '@material-ui/core/DialogTitle'
import Button from '@material-ui/core/Button'

const AlertDialog = ({
  title,
  open,
  submitFunction,
  handleClose,
}: {
  title: string,
  open: boolean,
  submitFunction: () => void,
  handleClose: () => void,
}): JSX.Element => {
  const onSubmit = () => {
    submitFunction()
    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>
        { title }
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
          onClick={onSubmit}
        >
          agree
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AlertDialog
