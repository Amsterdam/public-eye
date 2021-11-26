import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core'
import Fab from '@material-ui/core/Fab'
import AddIcon from '@material-ui/icons/Add'
import NewUserDialog from './NewUserDialog'
import UserList from './UserList'

const useStyles = makeStyles((theme) => ({
  root: {
    height: `calc(100vh - ${theme.spacing(8)}px)`,
    display: 'flex',
    paddingTop: theme.spacing(8),
    justifyContent: 'center',
  },
  newUserButton: {
    position: 'fixed',
    right: 20,
    bottom: 20,
  },
}))

const UsersView = (): JSX.Element => {
  const classes = useStyles()
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false)

  return (
    <div className={classes.root}>
      <UserList />
      <Fab
        className={classes.newUserButton}
        color="secondary"
        variant="extended"
        onClick={() => setNewUserDialogOpen(true)}
      >
        <AddIcon />
        new user
      </Fab>
      <NewUserDialog
        open={newUserDialogOpen}
        handleClose={() => setNewUserDialogOpen(false)}
      />
    </div>
  )
}

export default UsersView
