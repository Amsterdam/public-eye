import React, { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Button,
  makeStyles,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  Box,
} from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'
import { RootState } from 'reducers'
import { useThunkDispatch } from 'store'
import startVideoCapture from 'thunks/jobs/startVideoCapture'

const useStyles = makeStyles((theme) => ({
  button: {
    margin: theme.spacing(1),
  },
  formControl: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    minWidth: '90%',
    maxWidth: '90%',
  },
  textFieldContainer: {
    paddingTop: theme.spacing(1),
  },
}))

const CaptureDialog = () => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [open, setOpen] = useState(false)
  const [stream, setStream] = useState('')
  const [name, setName] = useState('')
  const [scaleFactor, setScaleFactor] = useState('')
  const [inputFps, setInputFps] = useState('')
  const [outputFps, setOutputFps] = useState('')
  const cameras = useSelector((state: RootState) => state.cameras)

  const commitStart = useCallback(() => {
    dispatch(startVideoCapture({
      stream,
      name,
      scale_factor: scaleFactor,
      input_fps: inputFps,
      output_fps: outputFps,
    }))
    setOpen(false)
  }, [dispatch, stream, name, scaleFactor, inputFps, outputFps])

  return (
    <>
      <Button
        color="primary"
        variant="contained"
        onClick={() => setOpen(true)}
        className={classes.button}
      >
        <AddIcon />
        capture
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>
          Start capture video
        </DialogTitle>
        <DialogContent>
          <FormControl className={classes.formControl}>
            <InputLabel>stream url</InputLabel>
            <Select
              value={stream}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStream(e.target.value)}
            >
              {
                Array.from(cameras.values()).map(({
                  id, stream_url: streamUrl, name: streamName,
                }) => (
                  <MenuItem key={id} value={streamUrl}>{ streamName || streamUrl }</MenuItem>
                ))
              }
            </Select>
          </FormControl>
          <Box paddingTop={1}>
            <TextField
              label="name"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              value={name}
            />
          </Box>
          <Box paddingTop={1}>
            <TextField
              label="scale factor"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScaleFactor(e.target.value)}
              value={scaleFactor}
            />
          </Box>
          <Box paddingTop={1}>
            <TextField
              label="input fps"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setInputFps(e.target.value)
              }}
              value={inputFps}
            />
          </Box>
          <Box paddingTop={1}>
            <TextField
              label="output fps"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setOutputFps(e.target.value)
              }}
              value={outputFps}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            onClick={() => setOpen(false)}
          >
            close
          </Button>
          <Button
            color="primary"
            onClick={commitStart}
            disabled={
              name === ''
              || stream === ''
              || inputFps === ''
            }
          >
            start
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CaptureDialog
