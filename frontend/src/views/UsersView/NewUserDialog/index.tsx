import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import TextField from '@material-ui/core/TextField'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import newUser from 'thunks/users/newUser'
import { VoidFunction } from 'types'
import { useThunkDispatch } from 'store'

const useStyles = makeStyles((theme) => ({
  textField: {
    width: 250,
    paddingBottom: theme.spacing(1),
  },
}))

const NewUserDialog = ({
  open,
  handleClose,
}: {
  open: boolean,
  handleClose: VoidFunction,
}): React.ReactElement => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submitNewUsers = () => {
    dispatch(newUser(email, password))
      .finally(() => handleClose())
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>
        New User
      </DialogTitle>
      <DialogContent>
        <div>
          <TextField
            className={classes.textField}
            label="email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <TextField
            className={classes.textField}
            onChange={(e) => setPassword(e.target.value)}
            label="password"
            type="password"
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
          onClick={handleClose}
        >
          close
        </Button>
        <Button
          color="primary"
          disabled={email === '' || password === ''}
          onClick={submitNewUsers}
        >
          submit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NewUserDialog
