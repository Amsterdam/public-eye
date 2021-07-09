import React, {
  useState, useEffect, useMemo, memo, useRef,
} from 'react'
import Slider from '@material-ui/core/Slider';
import { makeStyles } from '@material-ui/core/styles'
import HTML5Backend from 'react-dnd-html5-backend'
import { DndProvider } from 'react-dnd'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'
import insertCalibration from 'thunks/cameras/insertCalibration'
import { getToken } from 'utils'
import { RootState } from 'reducers'
import { StreamCapture as StreamCaptureType } from 'types'
import getStreamCaptureByCameraId from 'thunks/cameras/getStreamCaptureByCameraId'
import StreamCapture from './StreamCapture'

const GRID_COLOR = 'rgba(0, 255, 255, .9)'
const STREAM_CAPTURE_WIDTH = 600

const useStyles = makeStyles((theme) => ({
  textField: {
    margin: theme.spacing(2),
    minWidth: 400,
  },
  streamCapture: {
    width: STREAM_CAPTURE_WIDTH,
    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
    margin: theme.spacing(2),
  },
  content: {
    width: 1200,
  },
  projectedImageContainer: {
    overflow: 'hidden',
    width: 500,
    backgroundColor: 'black',
    margin: theme.spacing(2),
  },
  grid: {
    position: 'fixed',
    backgroundImage: ` linear-gradient(0deg, transparent 24%, ${GRID_COLOR} 25%, ${GRID_COLOR} 26%, transparent 27%, transparent 74%, ${GRID_COLOR} 75%, ${GRID_COLOR} 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, ${GRID_COLOR} 25%, ${GRID_COLOR} 26%, transparent 27%, transparent 74%, ${GRID_COLOR} 75%,  76%, transparent 77%, transparent)`,
    backgroundColor: 'transparant',
  },
  slider: {
    width: 200,
    padding: theme.spacing(2),
  },
}))

type CalibrateDialogProps = {
  open: boolean,
  handleClose: () => null,
  cameraId: number,
}

type TransformationMatrix = {
  a: number,
  b: number,
  c: number,
  d: number,
}

const CalibrateDialog = (props: CalibrateDialogProps) => {
  const {
    open,
    handleClose,
    cameraId,
  } = props

  const classes = useStyles()
  const projectedRef = useRef<HTMLDivElement>(null)
  const dispatch = useThunkDispatch()
  const [streamCapture, setStreamCapture] = useState<StreamCaptureType | null>(null)
  const [transformationMatrix, setTransformationMatrix] = (
    useState<TransformationMatrix | null>(null)
  )
  const [scaling, setScaling] = useState(30)
  const [squareMeter, setSquareMeter] = useState(1)
  const [imageWidth, setImageWidth] = useState(1)
  const [ordering, setOrdering] = useState('0123')

  useEffect(() => {
    if (!cameraId) {
      return
    }
    dispatch(getStreamCaptureByCameraId(cameraId))
      .then((result) => {
        if (result) {
          setStreamCapture(result)
        } else {
          setStreamCapture(null)
        }
      })
  }, [cameraId, dispatch])

  const baseUrl = useSelector((state: RootState) => state.general.baseUrl)

  const token = getToken()

  const streamCaptureUrl = useMemo(
    () => streamCapture && `${baseUrl}/files/stream_capture/${streamCapture.id}?tk=${token}&?date=${Date.now()}`,
    [baseUrl, streamCapture, token],
  )

  const grid = () => {
    if (projectedRef === null || projectedRef.current === null) {
      return ''
    }
    const {
      left, top, width, height,
    } = projectedRef.current.getBoundingClientRect()

    return (
      <div
        style={{
          left,
          top,
          width,
          height,
          backgroundSize: `${scaling}px ${scaling}px`,
        }}
        className={classes.grid}
      />
    )
  }

  const projectedImage = () => {
    if (transformationMatrix) {
      const {
        a, b, c, d,
      } = transformationMatrix

      return (
        <img
          alt="projection"
          className={classes.streamCapture}
          src={streamCaptureUrl}
          style={{
            transform: `matrix(${a}, ${b}, ${c}, ${d}, 0, 0)`,
            margin: 0,
          }}
        />
      )
    }

    return ''
  }

  useEffect(() => {
    const img = new Image()
    img.src = streamCaptureUrl
    img.onload = () => {
      setImageWidth(img.width)
    }
  }, [streamCaptureUrl])

  const submitFunction = () => {
    const imageRatio = imageWidth / STREAM_CAPTURE_WIDTH
    const fromPixelToSquareM = ((scaling / 2) / squareMeter) * imageRatio

    const {
      a, b, c, d,
    } = transformationMatrix

    dispatch(insertCalibration(cameraId, a, b, c, d, fromPixelToSquareM))
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
    >
      <DialogTitle>
        Calibrate Stream
      </DialogTitle>
      <DialogContent className={classes.content}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="subtitle1" gutterBottom>
              Scale factor
            </Typography>
            <Slider
              disabled={!streamCapture}
              className={classes.slider}
              value={scaling}
              onChange={(e, v) => setScaling(v)}
            />
          </div>
          <TextField
            value={squareMeter}
            onChange={(e) => setSquareMeter(e.target.value)}
            disabled={!streamCapture}
            label="Cell in m^2"
          />
          <TextField
            label="ordering of points"
            disabled={!streamCapture}
            onChange={(e) => setOrdering(e.target.value)}
            value={ordering}
          />
        </div>
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <DndProvider backend={HTML5Backend}>
            <StreamCapture
              ordering={ordering}
              setTransformationMatrix={setTransformationMatrix}
              streamCaptureUrl={streamCaptureUrl}
            />
          </DndProvider>
          <div ref={projectedRef} className={classes.projectedImageContainer}>
            { projectedImage() }
          </div>
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
          onClick={submitFunction}
          disabled={transformationMatrix === null}
        >
          submit
        </Button>
      </DialogActions>
      {grid()}
    </Dialog>
  )
}

const areEqual = (
  prevProps: { open: boolean },
  nextProps: { open: boolean },
) => prevProps.open === nextProps.open

export default memo(CalibrateDialog, areEqual)
