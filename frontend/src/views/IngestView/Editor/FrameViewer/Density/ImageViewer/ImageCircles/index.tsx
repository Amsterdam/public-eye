import React from 'react'
import { StoreContext } from '../../context'
import Circle from '../../Circle'

type ImageCircleProps = {
  locked: boolean,
}

const ImageCircles = (props: ImageCircleProps) => {
  const {
    locked,
  } = props

  const {
    renderedImageSize: [{
      left, top, width: imageWidth, height: imageHeight,
    }],
    tags: [tags],
    originalImageSize: [[originalWidth, originalHeight]],
  } = React.useContext(StoreContext)

  const createCircle = React.useCallback(
    ({ x, y, id }: { x: number, y: number, id: number }, index: number) => (
      x > 0 && y > 0 && originalHeight > 0 && originalWidth > 0
        ? (
          // @ts-ignore
          <Circle
            locked={locked}
            y={top + (y / (originalWidth / imageWidth))}
            x={left + (x / (originalHeight / imageHeight))}
            index={index}
            key={index}
            id={id}
            circleRadius={3}
          />
        ) : ''
    ), [imageHeight, imageWidth, left, locked, originalWidth, originalHeight, top],
  )

  return tags.map(createCircle)
}

// @ts-ignore
export default React.memo(ImageCircles)
