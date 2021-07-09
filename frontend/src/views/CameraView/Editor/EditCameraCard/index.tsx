import React, { useState, useEffect, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  pipe,
  keys,
  map,
  fromPairs,
} from 'ramda'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardActions from '@material-ui/core/CardActions'
import { makeStyles } from '@material-ui/core'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import updateCamera from 'thunks/cameras/updateCamera'
import { useSelectedId, useCamera } from 'utils'
import { Camera } from 'types'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    width: 300,
  },
  textField: {
    margin: theme.spacing(1),
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
  },
  textFieldContainer: {
    marginRight: theme.spacing(4),
  },
}))

const convertNullToEmptyString = (mapp: Record<string, string>) => pipe(
  keys,
  map((key) => [key, mapp[key] || '']),
  fromPairs,
)(mapp)

const EditCameraCard = () => {
  const selectedCameraId = useSelectedId()
  const selectedCamera = useCamera(selectedCameraId)
  const classes = useStyles()
  const dispatch = useDispatch()

  const [editedCamera, setEditedCamera] = useState<Camera>({
    name: '',
    stream_url: '',
    supplier: '',
    azimuth: '',
    geo_long: '',
    geo_lat: '',
    area_size_m2: '',
  })

  const changeHandler = useCallback((prop) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist()
    setEditedCamera((camera) => ({
      ...camera,
      [prop]: e.target.value,
    }))
  }, [])

  useEffect(() => {
    setEditedCamera(convertNullToEmptyString(selectedCamera))
  }, [selectedCamera])

  const commitUpdateCamera = useCallback(() => {
    dispatch(updateCamera(selectedCameraId, editedCamera))
  }, [dispatch, editedCamera, selectedCameraId])

  return (
    <div className={classes.root}>
      <Card>
        <CardHeader title="Edit camera" />
        <div className={classes.textFieldContainer}>
          <TextField
            label="name"
            className={classes.textField}
            value={editedCamera.name || ''}
            onChange={changeHandler('name')}
            fullWidth
          />
        </div>
        <div className={classes.textFieldContainer}>
          <TextField
            label="stream url"
            className={classes.textField}
            value={editedCamera.stream_url || ''}
            onChange={changeHandler('stream_url')}
            fullWidth
          />
        </div>
        <div className={classes.textFieldContainer}>
          <TextField
            label="supplier"
            className={classes.textField}
            value={editedCamera.supplier || ''}
            onChange={changeHandler('supplier')}
            fullWidth
          />
        </div>
        <div className={classes.textFieldContainer}>
          <TextField
            label="azimuth"
            className={classes.textField}
            value={editedCamera.azimuth || ''}
            onChange={changeHandler('azimuth')}
            fullWidth
          />
        </div>
        <div className={classes.textFieldContainer}>
          <TextField
            label="longitude"
            className={classes.textField}
            value={editedCamera.geo_long || ''}
            onChange={changeHandler('geo_long')}
            fullWidth
          />
        </div>
        <div className={classes.textFieldContainer}>
          <TextField
            label="latitude"
            className={classes.textField}
            value={editedCamera.geo_lat || ''}
            onChange={changeHandler('geo_lat')}
            fullWidth
          />
        </div>
        <div className={classes.textFieldContainer}>
          <TextField
            label="fps"
            className={classes.textField}
            value={editedCamera.fps || ''}
            onChange={changeHandler('fps')}
            fullWidth
          />
        </div>
        <div className={classes.textFieldContainer}>
          <TextField
            label="area size m2"
            className={classes.textField}
            value={editedCamera.area_size_m2 || ''}
            onChange={changeHandler('area_size_m2')}
            fullWidth
          />
        </div>
        <CardActions>
          <Button
            color="primary"
            size="small"
            onClick={commitUpdateCamera}
            fullWidth
          >
            edit
          </Button>
        </CardActions>
      </Card>
    </div>
  )
}

export default EditCameraCard
