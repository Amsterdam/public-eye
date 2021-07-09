import React, { useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import insertCamera from 'thunks/cameras/insertCamera'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  textField: {
    margin: theme.spacing(1),
    width: 300,
  },
}))

type NewCameraDialogProps = {
  open: boolean,
  handleClose: () => null,
}

const NewCameraDialog = (props: NewCameraDialogProps): React.ReactElement => {
  const classes = useStyles()
  const dispatch = useDispatch()
  const {
    open,
    handleClose,
  } = props

  const [editedCamera, setEditedCamera] = useState({
    name: '',
    stream_url: '',
    supplier: '',
    azimuth: '',
    geo_long: '',
    geo_lat: '',
    fps: '24',
  })

  const changeHandler = (prop: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist()
    setEditedCamera((camera) => ({
      ...camera,
      [prop]: e.target.value,
    }))
  }

  const commitUpdateCamera = useCallback(() => {
    dispatch(insertCamera(editedCamera))
    handleClose()
  }, [dispatch, editedCamera, handleClose])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>
        New camera
      </DialogTitle>
      <DialogContent>
        <div>
          <TextField
            label="name"
            className={classes.textField}
            value={editedCamera.name || ''}
            onChange={changeHandler('name')}
          />
        </div>
        <div>
          <TextField
            label="stream url"
            className={classes.textField}
            value={editedCamera.stream_url || ''}
            onChange={changeHandler('stream_url')}
          />
        </div>
        <div>
          <TextField
            label="supplier"
            className={classes.textField}
            value={editedCamera.supplier || ''}
            onChange={changeHandler('supplier')}
          />
        </div>
        <div>
          <TextField
            label="azimuth"
            className={classes.textField}
            value={editedCamera.azimuth || ''}
            onChange={changeHandler('azimuth')}
          />
        </div>
        <div>
          <TextField
            label="longitude"
            className={classes.textField}
            value={editedCamera.geo_long || ''}
            onChange={changeHandler('geo_long')}
          />
        </div>
        <div>
          <TextField
            label="latitude"
            className={classes.textField}
            value={editedCamera.geo_lat || ''}
            onChange={changeHandler('geo_lat')}
          />
        </div>
        <div>
          <TextField
            label="fps"
            className={classes.textField}
            value={editedCamera.fps || ''}
            onChange={changeHandler('fps')}
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
          disabled={editedCamera.stream_url === ''}
          onClick={commitUpdateCamera}
        >
          confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NewCameraDialog
