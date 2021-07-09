import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'

import createNewCollection from 'thunks/collections/createNewCollection'

const useStyles = makeStyles({
  root: {
    width: 500,
  },
  textField: {
    width: 300,
  },
})

const NewCollectionDialog = ({
  open,
  handleClose,
}: {
  open: boolean,
  handleClose: () => void,
}) => {
  const classes = useStyles()
  const dispatch = useDispatch()

  const [collectionName, setCollectionName] = useState('')
  const changeCollectionName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCollectionName(e.target.value)
  }

  const submitAction = () => {
    dispatch(createNewCollection(collectionName))
    handleClose()
  }

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>
        Create New Collection
      </DialogTitle>
      <DialogContent className={classes.root}>
        <div className={classes.textField}>
          <TextField
            value={collectionName}
            onChange={changeCollectionName}
            variant="outlined"
            fullWidth
            label="Collection Name"
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Disagree
        </Button>
        <Button
          disabled={collectionName === ''}
          onClick={submitAction}
          color="primary"
          autoFocus
        >
          Agree
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NewCollectionDialog
