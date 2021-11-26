import React, {
  useRef,
  useCallback,
  useEffect,
} from 'react'
import { useDrop } from 'react-dnd'
import { useThunkDispatch } from 'store'
import {
  update,
} from 'ramda'
import updateTag from 'thunks/tags/updateTag'
import { makeStyles } from '@material-ui/core/styles'
import { useMeasure } from 'utils'
import { useMouse } from 'react-use'
import { StoreContext } from '../context'
import { ITEM_TYPE_CIRCLE } from '../Circle'
import ImageCircles from './ImageCircles'
import ZoomLens from '../ZoomLens'

const useStyles = makeStyles((theme) => ({
  root: {
    '-webkit-touch-callout': 'none',
    '-webkit-user-select': 'none',
    '-khtml-user-select': 'none',
    '-moz-user-select': 'none;',
    '-ms-user-select': 'none',
    'user-select': 'none',
    display: 'flex',
    maxHeight: `calc(100vh - ${theme.spacing(40)}px)`,
  },
  img: {
    maxHeight: `calc(100vh - ${theme.spacing(42)}px)`,
    maxWidth: '100%',
    objectFit: 'scale-down',
  },
}))

const useImageSize = (src: string) => {
  const [width, setImageWidth] = React.useState(0)
  const [height, setImageHeight] = React.useState(0)

  React.useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      setImageWidth(img.width)
      setImageHeight(img.height)
    }
  }, [src])

  return { width, height }
}

const useZoomSetter = (
  mouseRef: React.RefObject<HTMLDivElement>,
  choosingZoom: boolean,
  left: number,
  top: number,
  width: number,
  height: number,
  setZoomLocation: React.Dispatch<React.SetStateAction<[number, number]>>,
  zoomSize: number,
) => {
  const { docX, docY } = useMouse(mouseRef)

  useEffect(() => {
    if (!choosingZoom) {
      return
    }
    const x = docX - (left + window.scrollX)
    const y = docY - (top + window.scrollY)

    let newZoomLeft = (x / width) - ((zoomSize) / width / 2)
    let newZoomTop = (y / height) - ((zoomSize) / height / 2)

    /* set to border if out of bounds */
    if (newZoomLeft < 0) {
      newZoomLeft = 0
    }
    if (newZoomLeft > (1 - (zoomSize / width))) {
      newZoomLeft = 1 - (zoomSize / width)
    }
    if (newZoomTop < 0) {
      newZoomTop = 0
    }
    if (newZoomTop > (1 - (zoomSize / height))) {
      newZoomTop = 1 - (zoomSize / height)
    }

    setZoomLocation([newZoomLeft, newZoomTop])
  }, [docX, docY, choosingZoom, height, setZoomLocation, width, left, top, zoomSize])
}

const ImageViewer = ({
  handleClick,
  url,
  locked,
}: {
  locked: boolean,
  handleClick: () => void,
  url: string,
}) => {
  const {
    zoomSize: [zoomSize],
    zoomLocation: [, setZoomLocation],
    choosingZoom: [choosingZoom],
    renderedImageSize: [, setRenderedImageSize],
    originalImageSize: [[imageWidth], setOriginalImageSize],
    tags: [tags, setTags],
  } = React.useContext(StoreContext)

  const { width: originalImageWidth, height: originalImageHeight } = useImageSize(url)

  useEffect(() => {
    setOriginalImageSize([originalImageWidth, originalImageHeight])
  }, [setOriginalImageSize, originalImageHeight, originalImageWidth])

  const [
    newImagRef,
    {
      left: newLeft,
      top: newTop,
      width,
      height,
    },
    imageLoad,
  ] = useMeasure()
  useEffect(() => {
    setRenderedImageSize({
      width,
      height,
      left: newLeft,
      top: newTop,
    })
  }, [width, height, newLeft, newTop, setRenderedImageSize])

  const divRef = useRef<HTMLImageElement>(null)
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const scalingFactor = imageWidth ? (width / imageWidth) : 1

  const fromDomSpaceToImageSpace = useCallback(
    (value) => value / scalingFactor, [scalingFactor],
  )

  const [, dropImage] = useDrop({
    accept: ITEM_TYPE_CIRCLE,
    // @ts-ignore
    drop(item: { index: number, x: number, y: number }, monitor) {
      // @ts-ignore
      if (item.zoom) {
        return
      }
      const delta = monitor.getDifferenceFromInitialOffset()
      const newX = Math.round(
        // @ts-ignore
        fromDomSpaceToImageSpace((Number(item.x) + delta.x) - newLeft),
      )
      const newY = Math.round(
        // @ts-ignore
        fromDomSpaceToImageSpace((Number(item.y) + delta.y) - newTop),
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      dispatch(updateTag(
        tags[item.index].id,
        tags[item.index].frame_id,
        newX,
        newY,
      ))
        // @ts-ignore
        .then((result) => setTags(update(item.index, result)))
    },
  })

  // @ts-ignore
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const imageClick = useCallback(handleClick(
    // @ts-ignore
    (value) => Math.round((value - (newLeft)) / scalingFactor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // @ts-ignore
    (value) => Math.round((value - (newTop)) / scalingFactor),
  ), [handleClick, divRef, scalingFactor])

  const mouseRef = React.useRef(null)

  useZoomSetter(
    mouseRef,
    choosingZoom,
    newLeft,
    newTop,
    width,
    height,
    setZoomLocation,
    zoomSize,
  )

  return (
    <div className={classes.root} ref={dropImage}>
      <div
        onClick={imageClick}
        style={{
          display: 'flex',
          alignSelf: 'flex-start',
        }}
        ref={mouseRef}
      >
        <ZoomLens />
        <img
          onLoad={imageLoad}
          src={url}
          alt="frame"
          width="auto"
          height="auto"
          ref={newImagRef}
          className={classes.img}
        />
        <ImageCircles
          locked={locked}
        />
      </div>
    </div>
  )
}

export default React.memo(ImageViewer)
