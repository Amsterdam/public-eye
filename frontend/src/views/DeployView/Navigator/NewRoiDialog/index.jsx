import React, { useState,  useEffect } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import DialogContent from '@material-ui/core/DialogContent'
import InputAdornment from '@material-ui/core/InputAdornment'
import IconButton from '@material-ui/core/IconButton'
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera'

import RegionOfInterest from 'common/RegionOfInterest'
import getStreamCaptureByUrl from 'thunks/streams/getStreamCaptureByUrl'
import submitRoi from 'thunks/streams/submitRoi'
import captureStream from 'thunks/streams/captureStream'


const useStyles = makeStyles(theme => ({
  textField: {
    margin: theme.spacing(0.5),
    minWidth: 400,
  },
}))

const NewRoiDialog = (props) => {
  const {
    open,
    handleClose
  } = props

  const classes = useStyles()
  const dispatch = useDispatch()
  const [areaPoints, setAreaPoints] = useState([])
  const [name, setName] = useState('')
  const [streamUrl, setStreamUrl] = useState('')
  const [streamCapture, setStreamCapture] = useState(null)

  const submitFunction = () => {
    dispatch(submitRoi(streamCapture.id, areaPoints, name))
    handleClose()
  }
  
  const commitCapture = async () => {
    const res = await dispatch(captureStream(streamUrl))

    setStreamCapture(res)
  }

  useEffect(() => {
    if (!streamUrl) {
      return
    }
    dispatch(getStreamCaptureByUrl(streamUrl))
      .then((result) => {
        if (result) {
          setStreamCapture(result)
        }
      })
  }, [streamUrl, dispatch])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
    >
      <DialogTitle> Create Region of Interest </DialogTitle>
      <DialogContent>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', }}>
          <TextField
            value={streamUrl}
            onChange={e => setStreamUrl(e.target.value)}
            label="Stream URL"
            className={classes.textField}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={commitCapture}
                    disabled={streamUrl === ''}
                  >
                    <PhotoCameraIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </div>
        <div>
          <TextField
            label="Name"
            value={name}
            onChange={e =>  setName(e.target.value)}
            className={classes.textField}
          />
        </div>
        <RegionOfInterest
          streamCapture={streamCapture}
          areaPoints={areaPoints}
          setAreaPoints={setAreaPoints}
        />
       
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
          onClick={submitFunction}
          disabled={areaPoints.length === 0 || name === ""}
        >
          submit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

NewRoiDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
}

export default NewRoiDialog
