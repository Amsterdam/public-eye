import React from 'react'
import { useDrag } from 'react-dnd'

export const ItemTypes = {
  POINT: 'point',
}

const POINT_SIZE = 10

type PointProps = {
  top: number,
  left: number,
  topImage: number,
  leftImage: number,
  index: number,
}

const Point = (props: PointProps): React.ReactElement => {
  const {
    top,
    left,
    topImage,
    leftImage,
    index,
  } = props

  const [, drag] = useDrag({
    item: { index, type: ItemTypes.POINT },
  })

  return (
    <div
      ref={drag}
      style={{
        left: left + leftImage - (POINT_SIZE / 2),
        top: top + topImage - (POINT_SIZE / 2),
        position: 'fixed',
        width: POINT_SIZE,
        height: POINT_SIZE,
        borderRadius: 5,
        backgroundColor: 'cyan',
        cursor: 'pointer',
        fontSize: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
      }}
    >
      { index }
    </div>
  )
}

export default Point
