import React, {
  useState, useRef, useCallback, useEffect,
} from 'react'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import { useDrop } from 'react-dnd'
import { fromTriangles, Point as TransPointType } from 'transformation-matrix'
import Point, { ItemTypes } from './Point'
import type { TransformationMatrix } from '..'

const useStyles = makeStyles((theme) => ({
  streamCapture: {
    width: 600,
    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
    margin: theme.spacing(2),
  },
}))

const BIRDS_EYE_SIZE = 500

type StreamCaptureProps = {
  streamCaptureUrl: string | null,
  setTransformationMatrix: React.Dispatch<React.SetStateAction<TransformationMatrix | null>>,
  ordering: string,
}

type PointType = { left: number, top: number }

const StreamCapture = (props: StreamCaptureProps): React.ReactElement => {
  const {
    streamCaptureUrl, setTransformationMatrix, ordering,
  } = props
  const [points, setPoints] = useState<PointType[]>([])
  const classes = useStyles()
  const ref = useRef<HTMLImageElement | null>(null)

  const applyTransformation = useCallback((tempPoints: PointType[]) => {
    if (ref.current === null) {
      return
    }
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

    const mostTop = tempPoints.reduce(
      (a, b) => (a.top > b.top ? a : b),
    )
    const mostRight = tempPoints.reduce(
      (a, b) => (a.left > b.left ? a : b),
    )

    const sizeDifference = width / BIRDS_EYE_SIZE

    const offset = Math.sqrt(
      ((mostRight.top - mostTop.top) ** 2)
      + ((mostRight.left - mostTop.left) ** 2),
    ) / Math.sqrt(2) / sizeDifference

    const topLeft = [
      (tempPoints[Number(ordering[0])]).left * sizeDifference,
      (tempPoints[Number(ordering[0])]).top * sizeDifference]

    const transformTo = [
      topLeft,
      [topLeft[0], topLeft[1] + offset],
      [topLeft[0] + offset, topLeft[1] + offset],
    ]

    const transformFrom = [
      tempPoints[Number(ordering[0])],
      tempPoints[Number(ordering[1])],
      tempPoints[Number(ordering[2])],
    ]

    const transformed = transformFrom.map(({ left, top }) => [left, top])
    const A = fromTriangles(
      transformed as unknown as TransPointType[],
      transformTo as unknown as TransPointType[],
    )
    setTransformationMatrix(A)
  }, [ordering, setTransformationMatrix, points.length])

  const [, drop] = useDrop({
    accept: ItemTypes.POINT,
    hover(item, monitor) {
      if (ref.current === null) {
        return
      }
      const { left, top } = ref.current.getBoundingClientRect()
      const xy = monitor.getClientOffset()
      if (xy === null) {
        return
      }
      const { x, y } = xy
      const newPosition = { left: x - left, top: y - top }
      setPoints((ps) => R.update((item as unknown as { index: number }).index, newPosition)(ps))
    },
    drop() {
      applyTransformation(points)
    },
  })

  useEffect(() => {
    applyTransformation(points)
  }, [ordering, applyTransformation, points])

  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (ref.current === null) {
      return
    }
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
    if (ref.current === null) {
      return ''
    }
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
        src={streamCaptureUrl || ''}
      />
      {points.map(makePoint)}
    </div>
  )
}

export default StreamCapture
