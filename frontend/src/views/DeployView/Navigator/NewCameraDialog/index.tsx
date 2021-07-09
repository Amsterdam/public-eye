import React, {
  useState, memo, useMemo, useCallback,
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import startStreamCapture from 'thunks/jobs/startStreamCapture'
import { RootState } from 'reducers'
import CameraForm from '../CameraForm'
import defaultArgs, { StreamArgs } from '../defaultStream'

const useStyles = makeStyles((theme) => ({
  formControl: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    minWidth: '90%',
  },
  textField: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    minWidth: '90%',
  },
  checkBoxes: {
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
    margin: theme.spacing(1),
  },
  content: {
    display: 'flex',
  },
  gpuSelectorContainer: {
    width: '90%',
  },
  streamCapture: {
    width: 400,
  },
  streamCaptureContainer: {
    width: 400,
  },
  root: {
    maxWidth: 1000,
  },
  rightColumn: {
    margin: theme.spacing(1),
    padding: theme.spacing(1),
  },
}))

type NewCameraDialogProps = {
  open: boolean,
  handleClose: () => null,
  preset: StreamArgs,
}

const NewCameraDialog = (props: NewCameraDialogProps) => {
  const {
    open,
    handleClose,
    preset,
  } = props

  const dispatch = useDispatch()
  const classes = useStyles()
  const streamInstances = useSelector((state: RootState) => (
    Array.from(state.deploys.values())
      .filter(({ job_script_path: jobScriptPath }) => jobScriptPath.includes('stream_capture.py'))
  ))

  const [args, setArgs] = useState(defaultArgs)

  const handleSubmit = useCallback(() => {
    dispatch(startStreamCapture(args))
    handleClose()
  }, [args, dispatch, handleClose])

  // might be ineffecient
  const nameUsedOrSlash = useMemo(() => (
    Array.from(streamInstances.values()).some(({ name: streamInstanceName }) => args.name === streamInstanceName) || args.name.includes('/')
  ), [streamInstances, args.name])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
    >
      <DialogTitle>
        Add a new camera stream!
      </DialogTitle>
      <DialogContent className={classes.content}>
        <CameraForm preset={preset} args={args} setArgs={setArgs} />
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={handleClose}>
          close
        </Button>
        <Button
          color="primary"
          onClick={handleSubmit}
          disabled={nameUsedOrSlash}
        >
          submit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

NewCameraDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  preset: PropTypes.objectOf(),
}

NewCameraDialog.defaultProps = {
  preset: null,
}

const areEqual = (prevProps: NewCameraDialogProps, nextProps: NewCameraDialogProps) => (
  prevProps.open === nextProps.open
)

export default memo(NewCameraDialog, areEqual)
