import React, { useRef } from 'react'
import * as R from 'ramda'

type PolygonProps = {
  index: number,
  width: number,
  height: number,
  polygon: number[],
  onClick: () => null,
}

const Polygon = ({
  index, width, height, polygon, onClick,
}: PolygonProps): React.ReactElement => {
  const ref = useRef(null)
  const points = R.pipe(
    R.map((xy) => `${xy[0] * width},${xy[1] * height}`),
    R.join(' '),
  )(polygon)

  if (polygon.length < 3) {
    return ''
  }

  return (
    <div
      key={index}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
      }}
    >
      <svg
        height={height}
        width={width}
      >
        <polygon
          ref={ref}
          points={points}
          style={{ fill: 'rgba(0,255,255,0.3)' }}
        />
        Sorry, your browser does not support inline SVG.
      </svg>
    </div>
  )
}

export default Polygon
