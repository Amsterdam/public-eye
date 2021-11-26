// @ts-nocheck
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
import { LoiPolygon } from 'types'

const DEFAULT_WIDTH = 600

const useStyles = makeStyles((theme) => ({
  streamCaptureContainer: {
    position: 'relative',
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: 'cyan',
    borderRadius: 7,
  },
  area: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  resetButton: {
    marginTop: theme.spacing(1),
  },
}))

type LineOfInterestProps = {
  streamCapture: Record<string, unknown>,
  setAreaPoints: () => null,
  areaPoints: Record<string, unknown>[],
  imageWidth: number,
}

const LineOfInterest = (props: LineOfInterestProps): React.ReactElement => {
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

    if (clicks.length === 1) {
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

  const makeClick = useCallback((xy: [number, number], index: string) => {
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
          left: leftPosition - 3,
          top: topPosition - 3,
        }}
      />
    )
  }, [classes.dot, ref])

  const makeArea = useCallback((polygon: LoiPolygon, index: number) => {
    const width = imageWidth || DEFAULT_WIDTH
    const height = width * widthHeightRatio

    if (polygon.length < 1) {
      return ''
    }

    const x1 = polygon[0][0] * width
    const y1 = polygon[0][1] * height
    const x2 = polygon[1][0] * width
    const y2 = polygon[1][1] * height

    const vx = y2 - y1
    const vy = -(x2 - x1)
    const vl = Math.sqrt((vx ** 2) + (vy ** 2))
    const nvx = (vx / vl) * 10
    const nvy = (vy / vl) * 10

    // Add a new line to create better visuals
    return (
      <div
        onClick={onClick}
        key={index}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
        }}
      >
        <svg height={height} width={width}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            style={{
              stroke: 'rgba(0,255,255,0.5)',
              strokeWidth: '4px',
              borderRadius: 7,
            }}
          />
          <line
            x1={(x2 + x1) / 2}
            y1={(y2 + y1) / 2}
            x2={(x2 + x1) / 2 + nvx}
            y2={(y2 + y1) / 2 + nvy}
            style={{
              stroke: 'rgba(255, 0,255,0.7)',
              strokeWidth: '6px',
              borderRadius: 7,
            }}
          />
          Sorry, your browser does not support inline SVG.
        </svg>
      </div>
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
            For capturing pedestrians crossing line, select 2 dots to represent a Line of Interest.
            The red line represents side A.
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

export default LineOfInterest
