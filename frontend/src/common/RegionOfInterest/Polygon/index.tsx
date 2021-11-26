import React, { useRef } from 'react'
import * as R from 'ramda'

type PolygonProps = {
  width: number,
  height: number,
  polygon: [number, number][],
  onClick: (e: React.MouseEvent<HTMLImageElement>) => void,
}

const Polygon = ({
  width, height, polygon, onClick,
}: PolygonProps): JSX.Element | null => {
  const ref = useRef(null)
  const points = R.pipe(
    R.map((xy: [number, number]) => `${xy[0] * width},${xy[1] * height}`),
    R.join(' '),
  )(polygon)

  if (polygon.length < 3) {
    return null
  }

  return (
    <div
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
