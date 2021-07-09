import React, { useCallback, useEffect, useState } from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import Table from '@material-ui/core/Table'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableBody from '@material-ui/core/TableBody'
import Tooltip from '@material-ui/core/Tooltip'
import TableCell from '@material-ui/core/TableCell'
import IconButton from '@material-ui/core/IconButton'
import Paper from '@material-ui/core/Paper'
import EditIcon from '@material-ui/icons/Create'
import DeleteIcon from '@material-ui/icons/Delete'
import AlertDialog from 'common/AlertDialog'
import deleteUser from 'thunks/users/deleteUser'
import getAllUsers from 'thunks/users/getAllUsers'
import getAllRoles from 'thunks/users/getAllRoles'
import { RootState } from 'reducers'
import { User } from 'types'
import EditUserDialog from './EditUserDialog'
import RolesSelector from './RolesSelector'

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(2),
    minWidth: 800,
    overflow: 'auto',
  },
}))

const UserList = () => {
  const users: User[] = useSelector((state: RootState) => state.users)

  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [roles, setRoles] = useState([])
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState(null)

  useEffect(() => {
    dispatch(getAllUsers())
    dispatch(getAllRoles())
      .then((result) => {
        if (result) {
          setRoles(result)
        }
      })
      .catch()
  }, [dispatch])

  const onDeleteIconClick = useCallback((user: User) => () => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDeleteUser = useCallback(() => {
    if (userToDelete && userToDelete.id) {
      dispatch(deleteUser(userToDelete.id))
    }
  }, [userToDelete, dispatch])

  const onEditIconClick = useCallback((user) => () => {
    setUserToEdit(user)
    setEditDialogOpen(true)
  }, [])

  return (
    <>
      <Paper className={classes.root}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>
                <b>id</b>
              </TableCell>
              <TableCell>
                <b>email</b>
              </TableCell>
              <TableCell align="right">
                <b>roles</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Tooltip title="Delete user">
                    <IconButton
                      onClick={onDeleteIconClick(user)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip
                    title="Edit user"
                  >
                    <IconButton
                      size="small"
                      onClick={onEditIconClick(user)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {user.id}
                </TableCell>
                <TableCell>
                  {user.email}
                </TableCell>
                <TableCell style={{ display: 'flex' }} align="right">
                  <RolesSelector
                    userId={user.id}
                    // when no roles are present, backend sends [{}]
                    initialState={R.filter((e) => !R.isEmpty(e), user.roles)}
                    roles={roles}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <AlertDialog
        title={`Delete user ${(userToDelete && userToDelete.email) ? userToDelete.email : ''}`}
        open={deleteDialogOpen}
        handleClose={() => setDeleteDialogOpen(false)}
        submitFunction={confirmDeleteUser}
      />
      <EditUserDialog
        handleClose={() => setEditDialogOpen(false)}
        open={editDialogOpen}
        user={userToEdit}
      />
    </>
  )
}

export default UserList
