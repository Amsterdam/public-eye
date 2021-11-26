import React from 'react'
import { useDrag } from 'react-dnd'

export const ItemTypes = {
  POINT: 'point',
}

const POINT_SIZE = 10

const Point = ({
  top,
  left,
  topImage,
  leftImage,
  index,
}: {
  top: number,
  left: number,
  topImage: number,
  leftImage: number,
  index: number,
}): JSX.Element => {
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
