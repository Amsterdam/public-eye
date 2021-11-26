import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import DialogTitle from '@material-ui/core/DialogTitle'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'

const useStyles = makeStyles({
  content: {
    width: 400,
  },
})

const RenameDialog = ({
  open,
  handleClose,
  title,
  renameFunction,
}: {
  open: boolean,
  handleClose: () => void,
  title: string,
  renameFunction: (e: string) => void,
}): JSX.Element => {
  const classses = useStyles()
  const [name, setName] = useState('')
  const changeName = (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)

  const rename = () => {
    renameFunction(name)
    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>
        {title}
      </DialogTitle>
      <DialogContent
        className={classses.content}
      >
        <TextField
          label="Name"
          onChange={changeName}
          value={name}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
        >
          close
        </Button>
        <Button
          onClick={rename}
          disabled={name === ''}
        >
          rename
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RenameDialog
