import React, { useCallback, useState, memo } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import IconButton from '@material-ui/core/IconButton'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import AcountCircleIcon from '@material-ui/icons/AccountCircle'
import { setToken } from 'utils'
import resetState from 'actions/general/resetState'
import EditUserDialog from './EditUserDialog'

const UserMenu = () => {
  const history = useHistory()
  const dispatch = useDispatch()
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleLogout = useCallback(() => {
    handleClose()
    setToken('')
    dispatch(resetState())
    history.push('/login')
  }, [handleClose, history, dispatch])

  const handleEditUserClick = useCallback(() => {
    setEditUserDialogOpen(true)
    setAnchorEl(null)
  }, [])

  return (
    <>
      <IconButton onClick={handleClick}>
        <AcountCircleIcon fontSize="large" />
      </IconButton>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleEditUserClick}>
          edit password
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          logout
        </MenuItem>
      </Menu>
      <EditUserDialog
        open={editUserDialogOpen}
        handleClose={() => setEditUserDialogOpen(false)}
      />
    </>
  )
}

export default memo(UserMenu)
