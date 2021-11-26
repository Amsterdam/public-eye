import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Snackbar from '@material-ui/core/Snackbar'
import MuiAlert from '@material-ui/lab/Alert'
import setInfo from 'actions/general/setInfo'
import { RootState } from 'reducers'

const Info = (): JSX.Element => {
  const dispatch = useDispatch()
  const { open, message, severity } = useSelector((state: RootState) => state.general.info)

  const handleClose = () => {
    dispatch(setInfo(false, ''))
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <MuiAlert
        onClose={handleClose}
        severity={severity}
        elevation={6}
        variant="filled"
      >
        { message }
      </MuiAlert>
    </Snackbar>
  )
}

export default Info
