import React, {
  useState, useEffect, useMemo, memo, useRef,
} from 'react'
import Slider from '@material-ui/core/Slider';
import { makeStyles } from '@material-ui/core/styles'
import HTML5Backend from 'react-dnd-html5-backend'
import { DndProvider } from 'react-dnd'
import { useSelector } from 'react-redux'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera'
import InputAdornment from '@material-ui/core/InputAdornment'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import Divider from '@material-ui/core/Divider'
import captureStream from 'thunks/cameras/captureStream'
// import getStreamCaptureByUrl from 'thunks/streams/getStreamCaptureByUrl'
import insertCalibration from 'thunks/cameras/insertCalibration'
import { getToken } from 'utils'
import { useThunkDispatch } from 'store'
import { RootState } from 'reducers'
import { StreamCapture as StreamCaptureType } from 'types';
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

type TransformationMatrix = {
  a: number,
  b: number,
  c: number,
  d: number,
}

const CalibrateDialog = ({
  open,
  handleClose,
}: {
  open: boolean,
  handleClose: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const classes = useStyles()
  const projectedRef = useRef<HTMLDivElement>(null)
  const dispatch = useThunkDispatch()
  const [streamUrl, setStreamUrl] = useState('')
  const [streamCapture, setStreamCapture] = useState<StreamCaptureType | null>(null)
  const [transformationMatrix, setTransformationMatrix] = (
    useState<TransformationMatrix | null>(null)
  )
  const [scaling, setScaling] = useState(30)
  const [squareMeter, setSquareMeter] = useState(1)
  const [imageWidth, setImageWidth] = useState(1)
  const [ordering, setOrdering] = useState('0123')

  const commitCapture = async () => {
    // @ts-ignore
    const res = await dispatch(captureStream(streamUrl))

    // @ts-ignore
    setStreamCapture(res)
  }

  // useEffect(() => {
  //   if (!streamUrl) {
  //     return
  //   }
  //   dispatch(getStreamCaptureByUrl(streamUrl))
  //     .then((result) => {
  //       if (result) {
  //         setStreamCapture(result)
  //       }
  //     })
  // }, [streamUrl, dispatch])

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
          // @ts-ignore
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
    // @ts-ignore
    img.src = streamCaptureUrl
    img.onload = () => {
      setImageWidth(img.width)
    }
  }, [streamCaptureUrl])

  const submitFunction = () => {
    const imageRatio = imageWidth / STREAM_CAPTURE_WIDTH
    const fromPixelToSquareM = ((scaling / 2) / squareMeter) * imageRatio

    const {
      // @ts-ignore
      a, b, c, d,
    } = transformationMatrix

    // @ts-ignore
    dispatch(insertCalibration(streamCapture.id, a, b, c, d, fromPixelToSquareM))
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
          <TextField
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
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
          <div>
            <Typography variant="subtitle1" gutterBottom>
              Scale factor
            </Typography>
            <Slider
              disabled={!streamCapture}
              className={classes.slider}
              value={scaling}
              // @ts-ignore
              onChange={(e, v) => setScaling(v)}
            />
          </div>

          <TextField
            value={squareMeter}
            // @ts-ignore
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
              // @ts-ignore
              setTransformationMatrix={setTransformationMatrix}
              // @ts-ignore
              streamCaptureUrl={streamCaptureUrl}
            />
          </DndProvider>
          <div ref={projectedRef} className={classes.projectedImageContainer}>
            { projectedImage() }
          </div>
        </div>

      </DialogContent>
      <DialogActions>
        {/* @ts-ignore */}
        <Button
          // @ts-ignore
          color="primary"
          // @ts-ignore
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

export default memo(CalibrateDialog)
