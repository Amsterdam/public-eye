import React, {
  useState, useCallback, useMemo, useEffect,
} from 'react'
import * as R from 'ramda'
import { useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import FormHelperText from '@material-ui/core/FormHelperText'
import Button from '@material-ui/core/Button'
import { getToken } from 'utils'
import { RootState } from 'reducers'
import Polygon from './Polygon'

const DEFAULT_WIDTH = 600

const useStyles = makeStyles((theme) => ({
  streamCaptureContainer: {
    position: 'relative',
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: 'cyan',
    borderRadius: 5,
  },
  area: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  resetButton: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
}))

type RegionOfInterestProps = {
  streamCapture: Record<string, unknown>,
  setAreaPoints: () => null,
  areaPoints: [],
  imageWidth: number,
}

const RegionOfInterest = (props: RegionOfInterestProps): React.ReactElement => {
  const {
    streamCapture, setAreaPoints, areaPoints, imageWidth,
  } = props
  const classes = useStyles()
  const [ref, setRef] = useState<HTMLDivElement>(null)
  const [clicks, setClicks] = useState([])
  const baseUrl = useSelector((state: RootState) => state.general.baseUrl)
  const [widthHeightRatio, setWidthHeightRatio] = useState(1)

  const token = getToken()
  // Browser seems to cache the image and since the url doesnt change when a new capture is made
  // Date.now is used to make a unique url on rerender
  const streamCaptureUrl = useMemo(
    () => (
      streamCapture
        ? `${baseUrl}/files/stream_capture/${String(streamCapture.id)}?tk=${token}&?date=${Date.now().toString()}`
        : ''
    ),
    [baseUrl, streamCapture, token],
  )

  const onClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!setAreaPoints) return

    const {
      left, top, right, bottom,
    } = ref.getBoundingClientRect()

    const normalizedX = (e.clientX - left) / (right - left)
    const normalizedY = (e.clientY - top) / (bottom - top)

    if (clicks.length === 3) {
      const newClicks = R.append([normalizedX, normalizedY])(clicks)
      setAreaPoints((oldPoly) => R.append(newClicks, oldPoly))
      setClicks([])
    } else {
      const newClicks = R.append([normalizedX, normalizedY])(clicks)
      setClicks(newClicks)
    }
  }, [clicks, ref, setAreaPoints])

  useEffect(() => {
    let mounted = true
    const img = new Image()
    img.src = streamCaptureUrl
    img.onload = () => {
      if (mounted) {
        setWidthHeightRatio(img.height / img.width)
      }
    }
    return () => { mounted = false }
  }, [streamCaptureUrl])

  const makeClick = useCallback((xy: [number, number], index: number) => {
    const [x, y] = xy
    const {
      width, height,
    } = ref.getBoundingClientRect()
    const leftPosition = (x * width)
    const topPosition = (y * height)
    return (
      <div
        key={index}
        className={classes.dot}
        style={{
          position: 'absolute',
          left: leftPosition,
          top: topPosition,
        }}
      />
    )
  }, [classes.dot, ref])

  const makeArea = useCallback((polygon: number[], index: number) => {
    const width = imageWidth || DEFAULT_WIDTH
    return (
      <Polygon
        key={index}
        width={width}
        height={width * widthHeightRatio}
        polygon={polygon}
        onClick={onClick}
      />
    )
  }, [widthHeightRatio, onClick, imageWidth])

  return streamCaptureUrl
    ? (
      <div
        className={classes.streamCaptureContainer}
        style={{ width: imageWidth || DEFAULT_WIDTH }}
      >
        <div>
          <img
            ref={(newRef) => setRef(newRef)}
            key={streamCapture.capture_path}
            alt="stream-capture"
            style={{ width: imageWidth || DEFAULT_WIDTH }}
            src={streamCaptureUrl}
            onClick={onClick}
          />
          <FormHelperText>
            For partial detection during object recognition select four points in the above
            stream capture.
          </FormHelperText>
          {clicks.map(makeClick)}
          {areaPoints.map(makeArea)}
          {
            setAreaPoints
            && (
              <Button
                className={classes.resetButton}
                onClick={() => setAreaPoints([])}
                color="primary"
                size="small"
                variant="contained"
              >
                reset
              </Button>
            )
          }
        </div>
      </div>
    ) : (
      <FormHelperText>
        No streamcapture yet please try to capture by clicking on the photo camera button
      </FormHelperText>
    )
}

export default RegionOfInterest
