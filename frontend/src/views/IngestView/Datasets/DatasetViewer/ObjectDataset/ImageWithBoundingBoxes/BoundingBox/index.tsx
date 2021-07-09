import React, { useRef, useState } from 'react'
import { BoundingBox as BoundingBoxType } from 'types'

const BORDER_WIDTH = 3

type BoundingBoxProps = {
  imageHeight: number,
  imageWidth: number,
  scalingFactor: number,
  boundingBox: BoundingBoxType,
  imgRef: React.MutableRefObject<HTMLImageElement>,
}

const BoundingBox = (props: BoundingBoxProps): React.ReactElement => {
  const {
    imageHeight,
    imageWidth,
    scalingFactor,
    boundingBox,
    imgRef,
  } = props

  const {
    x,
    y,
    w,
    h,
    rgb,
  } = boundingBox

  const { left: imgLeft, top: imgTop } = imgRef.current.getBoundingClientRect()

  const left = (x * imageWidth * scalingFactor) + imgLeft
  const top = (y * imageHeight * scalingFactor) + imgTop
  const width = w * imageWidth * scalingFactor
  const height = h * imageHeight * scalingFactor
  const ref = useRef(null)

  return (
    <div
      ref={ref}
      style={{
        left: left - (width / 2),
        top: top - (height / 2),
        height,
        width,
        border: `${BORDER_WIDTH}px solid ${rgb}`,
        position: 'absolute',
      }}
    />
  )
}

export default BoundingBox
