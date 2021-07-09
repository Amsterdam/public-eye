import React, { useRef, useState, useEffect } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Dataset, BoundingBox as BoundingBoxType } from 'types'
import BoundingBox from './BoundingBox'

const useStyles = makeStyles(() => ({
  image: {
    height: 'auto',
    maxHeight: 600,
    maxWidth: 1200,
  },
}))

type ImageWithBoundingBoxesProps = {
  src: string,
  boundingBoxes: BoundingBoxType[],
  datasetSelectedId: string | null,
}

const ImageWithBoundingBoxes = (props: ImageWithBoundingBoxesProps): React.ReactElement => {
  const {
    src,
    boundingBoxes,
    datasetSelectedId,
  } = props

  const classes = useStyles()
  const ref = useRef<HTMLImageElement>(null)
  const [imageWidth, setImageWidth] = useState<number | null>(null)
  const [imageHeight, setImageHeight] = useState<number | null>(null)
  const [imageSize, setImageSize] = useState(800)
  const [, setImageLeft] = useState(null)

  const scalingFactor = imageWidth ? (imageSize / imageWidth) : 1

  const resize = () => {
    const {
      width,
      left,
    }: {
      width: number,
      left: number,
    } = ref.current ? ref.current.getBoundingClientRect() : { width: 800 }

    setImageLeft(left)
    setImageSize(width)
  }

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', resize)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', resize)
    }
  }, [])

  const setImageDimensions = (tempSrc: string) => {
    const img = new Image()
    img.src = tempSrc
    img.onload = () => {
      setImageWidth(img.width)
      setImageHeight(img.height)
      const { width } = ref.current ? ref.current.getBoundingClientRect() : { width: 800 }
      setImageSize(width)
    }
  }

  useEffect(() => {
    setImageDimensions(src)
    resize()
  }, [src, datasetSelectedId])

  const createBoundingBox = (boundingBox: BoundingBoxType, index: number) => (
    <BoundingBox
      imageHeight={imageHeight}
      imageWidth={imageWidth}
      scalingFactor={scalingFactor}
      boundingBox={boundingBox}
      imgRef={ref}
      key={index}
    />
  )

  return (
    <>
      <div ref={ref}>
        <img
          alt="_object_recogition_image'"
          src={src}
          className={classes.image}
        />
      </div>
      { ref.current && boundingBoxes.map(createBoundingBox) }
    </>
  )
}

export default ImageWithBoundingBoxes
