// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField'
import DialogContent from '@material-ui/core/DialogContent'
import Button from '@material-ui/core/Button'
import FormHelperText from '@material-ui/core/FormHelperText'
import { VoidFunction, User } from 'types'
import editUser from 'thunks/users/editUser'

const useStyles = makeStyles((theme) => ({
  textField: {
    width: 250,
    paddingBottom: theme.spacing(1),
  },
  formHelperText: {
    width: 250,
  },
}))

type EditUserDialogProps = {
  open: boolean,
  handleClose: VoidFunction,
  user: User,
}

const EditUserDialog = ({ open, handleClose, user }: EditUserDialogProps): React.ReactNode => {
  const classes = useStyles()
  const dispatch = useDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect((): void => {
    if (user) {
      setEmail(user.email)
      setPassword('')
    }
  }, [user])

  const confirmEdit = useCallback((): void => {
    if (user && user.id) {
      dispatch(editUser(user.id, email, password))
    }
    handleClose()
  }, [dispatch, email, password, user, handleClose])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>
        Edit user
      </DialogTitle>
      <DialogContent>
        <div>
          <TextField
            value={email}
            label="email"
            className={classes.textField}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <TextField
            value={password}
            className={classes.textField}
            type="password"
            label="password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <FormHelperText
          className={classes.formHelperText}
        >
          If you don&apos;t want to change the password, leave it empty. If you only want
          to change the password, leave the e-mail as it is.
        </FormHelperText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="primary"
        >
          close
        </Button>
        <Button
          onClick={confirmEdit}
          color="primary"
        >
          edit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditUserDialog
