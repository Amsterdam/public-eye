import React, {
  useCallback, useEffect, useState, memo,
} from 'react'
import { equals } from 'ramda'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField'
import DialogContent from '@material-ui/core/DialogContent'
import Button from '@material-ui/core/Button'
import getUserByToken from 'thunks/users/getUserByToken'
import editPassword from 'thunks/users/editPassword'

const useStyles = makeStyles((theme) => ({
  textField: {
    width: 300,
    paddingBottom: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  editRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  editButton: {
    margin: theme.spacing(1),
  },
}))

type EditUserDialogProps = {
  open: boolean,
  handleClose: () => null,
}

const EditUserDialog = ({ open, handleClose }: EditUserDialogProps) => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [currentUser, setCurrentUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [repeatedNewPassword, setRepeatedNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')

  useEffect(() => {
    dispatch(getUserByToken())
      .then((user) => {
        if (user) {
          setCurrentUser(user)
        }
      })
  }, [open, dispatch])

  const confirmEditPassword = useCallback(() => {
    if (newPassword && currentUser) {
      dispatch(editPassword(currentUser.id, newPassword, currentPassword))
    }
    handleClose()
  }, [currentPassword, currentUser, dispatch, newPassword, handleClose])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>
        Edit password
      </DialogTitle>
      <DialogContent>
        <div className={classes.editRow}>
          <TextField
            value={newPassword}
            className={classes.textField}
            autoComplete="off"
            type="password"
            label="new password"
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <TextField
            value={repeatedNewPassword}
            className={classes.textField}
            autoComplete="off"
            type="password"
            label="repeat new password"
            onChange={(e) => setRepeatedNewPassword(e.target.value)}
            error={!equals(repeatedNewPassword, newPassword)}
            helperText={
              equals(repeatedNewPassword, newPassword)
                ? ''
                : "Passwords don't match"
            }
          />
        </div>
        <div>
          <TextField
            className={classes.textField}
            type="password"
            autoComplete="off"
            label="current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="primary"
        >
          close
        </Button>
        <Button
          color="primary"
          onClick={confirmEditPassword}
        >
          edit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default memo(EditUserDialog)
