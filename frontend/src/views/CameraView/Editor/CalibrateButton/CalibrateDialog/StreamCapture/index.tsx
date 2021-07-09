import React, {
  useState, useRef, useCallback, useEffect,
} from 'react'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import { useDrop } from 'react-dnd'
import { fromTriangles } from 'transformation-matrix'
import Point, { ItemTypes } from './Point'

const useStyles = makeStyles((theme) => ({
  streamCapture: {
    width: 600,
    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
    margin: theme.spacing(2),
  },
}))

const BIRDS_EYE_SIZE = 500

type StreamCaptureProps = {
  streamCaptureUrl: string,
  setTransformationMatrix: () => null,
  ordering: string,
}

type PointType = { left: number, top: number }

const StreamCapture = (props: StreamCaptureProps): React.ReactElement => {
  const {
    streamCaptureUrl, setTransformationMatrix, ordering,
  } = props
  const [points, setPoints] = useState<PointType[]>([])
  const classes = useStyles()
  const ref = useRef<HTMLImageElement>(null)

  const applyTransformation = useCallback((tempPoints: PointType[]) => {
    const { width } = ref.current.getBoundingClientRect()

    const properOrdering = ordering.split('').every((index) => {
      try {
        return Number(index) < (tempPoints.length)
      } catch (e) {
        return false
      }
    })

    if (!properOrdering || (ordering.length !== points.length)) {
      return
    }

    const mostTop = R.reduce(
      R.minBy((a: PointType) => a.top), { top: Infinity },
    )(tempPoints) as PointType
    const mostRight = R.reduce(
      R.maxBy((a: PointType) => a.left), { left: 0 },
    )(tempPoints) as PointType

    const sizeDifference = width / BIRDS_EYE_SIZE

    const offset = Math.sqrt(
      ((mostRight.top - mostTop.top) ** 2)
      + ((mostRight.left - mostTop.left) ** 2),
    ) / Math.sqrt(2) / sizeDifference

    const topLeft = [
      (tempPoints[ordering[0]] as PointType).left * sizeDifference,
      (tempPoints[ordering[0]] as PointType).top * sizeDifference]

    const transformTo = [
      topLeft,
      [topLeft[0], topLeft[1] + offset],
      [topLeft[0] + offset, topLeft[1] + offset],
    ]

    const transformFrom = [
      tempPoints[ordering[0]],
      tempPoints[ordering[1]],
      tempPoints[ordering[2]],
    ]

    const A = fromTriangles(transformFrom.map(({ left, top }) => [left, top]), transformTo)
    setTransformationMatrix(A)
  }, [ordering, setTransformationMatrix, points.length])

  const [, drop] = useDrop({
    accept: ItemTypes.POINT,
    hover(item, monitor) {
      const { left, top } = ref.current.getBoundingClientRect()
      const { x, y } = monitor.getClientOffset()
      const newPosition = { left: x - left, top: y - top }
      setPoints((ps) => R.update(item.index, newPosition)(ps))
    },
    drop() {
      applyTransformation(points)
    },
  })

  useEffect(() => {
    applyTransformation(points)
  }, [ordering, applyTransformation, points])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { top, left } = ref.current.getBoundingClientRect()
    const newPoint = { left: e.clientX - left, top: e.clientY - top }

    if (points.length === 3) {
      applyTransformation(R.append(newPoint)(points))
      setPoints((ps) => R.append(newPoint)(ps))
    } else if (points.length < 4) {
      setPoints((ps) => R.append(newPoint)(ps))
    }
  }

  const makePoint = ({ left, top }: { left: number, top: number }, index: number) => {
    const { top: topImage, left: leftImage } = ref.current.getBoundingClientRect()

    return (
      <div
        key={index}
      >
        <Point
          index={index}
          top={top}
          left={left}
          topImage={topImage}
          leftImage={leftImage}
        />
      </div>
    )
  }

  return (
    <div ref={drop}>
      <img
        alt="stream-capture"
        ref={ref}
        onClick={handleClick}
        className={classes.streamCapture}
        src={streamCaptureUrl}
      />
      {points.map(makePoint)}
    </div>
  )
}

export default StreamCapture
