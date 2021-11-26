// @ts-nocheck
import React, { useRef } from 'react'
import * as R from 'ramda'

const BORDER_WIDTH = 2

type PropType = {
  imageHeight: number,
  imageWidth: number,
  scalingFactor: number,
  boundingBox: {
    x: number,
    y: number,
    w: number,
    h: number,
    rgb: string,
    bb_id: number,
  },
  setSelectedBoundingBox: () => void,
  onMouseMove: () => void,
  imgLeft: number,
  imgTop: number,
  resetCoords: () => void,
  handleClickCommit: () => void,
}

const BoundingBox = (props: PropType) => {
  const {
    imageHeight,
    imageWidth,
    scalingFactor,
    boundingBox,
    setSelectedBoundingBox,
    onMouseMove,
    imgLeft,
    imgTop,
    resetCoords,
    handleClickCommit,
  } = props

  const {
    x,
    y,
    w,
    h,
    rgb,
    bb_id: id,
  } = boundingBox

  const left = (imageWidth * x * scalingFactor) + imgLeft
  const top = (y * imageHeight * scalingFactor) + imgTop
  const width = w * imageWidth * scalingFactor
  const height = h * imageHeight * scalingFactor

  const ref = useRef<HTMLDivElement>(null)

  const clickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
    const {
      left: divLeft,
      top: divTop,
      right: divRight,
      bottom: divBottom,
    } = ref.current.getBoundingClientRect()

    // clicked on border
    if (
      Math.abs(divLeft - e.clientX) < 5
      || Math.abs(divTop - e.clientY) < 5
      || Math.abs(divRight - e.clientX) < 5
      || Math.abs(divBottom - e.clientY) < 5
    ) {
      resetCoords()
      setSelectedBoundingBox(id)
    } else {
      handleClickCommit(e.clientX, e.clientY)
    }
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onClick={clickHandler}
      // onClick={(e) => e.preventDefault()}
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

const areEqual = (prevProps: PropType, nextProps: PropType) => (
  prevProps.imgLeft !== nextProps.imgRight
  && prevProps.imgTop !== nextProps.imgTop
  && R.equals(prevProps.boundingBox, nextProps.boundingBox)
  && prevProps.imageHeight === nextProps.imageHeight
  && prevProps.imageWidth === nextProps.imageWidth
  && prevProps.scalingFactor === nextProps.scalingFactor
  && R.equals(prevProps.handleClickCommit, nextProps.handleClickCommit)
)

export default React.memo(BoundingBox, areEqual)
