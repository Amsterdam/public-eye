import React, { useMemo, useCallback, useEffect } from 'react'
import { useDrop } from 'react-dnd'
import {
  update,
  append,
} from 'ramda'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import updateTag from 'thunks/tags/updateTag'
import { Frame } from 'types'
import { useMeasure } from 'utils'
import commitTag from 'thunks/tags/commitTag'
import { StoreContext } from '../context'
import Circle, { ITEM_TYPE_CIRCLE } from '../Circle'
import { ZOOMED_IMAGED_SIZE } from '../constants'

const useStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingTop: 0,
    '-webkit-touch-callout': 'none',
    '-webkit-user-select': 'none',
    '-khtml-user-select': 'none',
    '-moz-user-select': 'none;',
    '-ms-user-select': 'none',
    'user-select': 'none',
  },
  zoomedImage: {
    width: ZOOMED_IMAGED_SIZE,
    height: ZOOMED_IMAGED_SIZE,
    backgroundColor: 'black',
    borderRadius: 4,
  },
}))

const circleInZoomArea = (
  zoomSize: number,
  circleX: number,
  circleY: number,
  zoomLocation: [number, number] | null,
  imageWidth: number,
  imageHeight: number,
): boolean => {
  if (zoomLocation === null) {
    return false
  }

  const [zoomLeft, zoomTop] = zoomLocation
  if (circleX < zoomLeft) {
    return false
  }
  if (circleY < zoomTop) {
    return false
  }
  if (circleX > (zoomLeft + (zoomSize / imageWidth))) {
    return false
  }
  if (circleY > (zoomTop + (zoomSize / imageHeight))) {
    return false
  }

  return true
}

const transformClickLocation = (
  zoomLocation: [number, number],
  clickX: number,
  clickY: number,
  originalHeight: number,
  originalWidth: number,
  imageWidth: number,
  imageHeight: number,
  zoomSize: number,
  zoomedImageSize: number,
  zoomLeft: number,
  zoomTop: number,
) => {
  const centerX = Math.round(
    (zoomLocation[0]
      + ((clickX - zoomLeft)
      / (zoomedImageSize * (imageWidth / zoomSize))))
      * originalWidth,
  )
  const centerY = Math.round(
    (zoomLocation[1]
      + ((clickY - zoomTop)
      / (zoomedImageSize * (imageHeight / zoomSize))))
      * originalHeight,
  )

  return { centerX, centerY }
}

const useBackgroundSize = (
  zoomSize: number,
  renderedWidth: number,
  renderedHeight: number,
) => {
  const backgroundSize = useMemo(() => {
    const height = ZOOMED_IMAGED_SIZE * (renderedWidth / zoomSize)
    const width = ZOOMED_IMAGED_SIZE * (renderedHeight / zoomSize)
    return `${width}px ${height}px`
  }, [renderedHeight, renderedWidth, zoomSize])

  return backgroundSize
}

const useBackgroundPosition = (
  zoomSize: number,
  zoomLocation: [number, number],
  renderedHeight: number,
  renderedWidth: number,
) => {
  const backgroundPosition = useMemo(() => {
    if (zoomLocation === null) {
      return '0px 0px'
    }
    return `-${zoomLocation[0] * ZOOMED_IMAGED_SIZE * (renderedWidth / zoomSize)}px -${zoomLocation[1] * ZOOMED_IMAGED_SIZE * (renderedHeight / zoomSize)}px`
  }, [zoomLocation, renderedHeight, renderedWidth, zoomSize])
  return backgroundPosition
}

const useLoadedImageSrc = (src: string, onload: () => void): string => {
  const [loadedSrc, setLoadedSrc] = React.useState('')

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setLoadedSrc(`url(${img.src})`)
      onload()
    }
    img.src = src
  }, [src, onload])

  return loadedSrc
}

const ZoomedImage = ({
  url,
  locked = false,
  frame,
}: {
  url: string,
  locked: boolean,
  frame: Frame,
}) => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [ref, { top, left }, imageLoad] = useMeasure()

  const {
    zoomSize: [zoomSize],
    zoomLocation: [zoomLocation],
    tags: [tags, setTags],
    renderedImageSize: [{ width: imageWidth, height: imageHeight }],
    choosingZoom: [choosingZoom, setChoosingZoom],
    originalImageSize: [[originalImageWidth, originalImageHeight]],
  } = React.useContext(StoreContext)

  const [, dropZoom] = useDrop({
    accept: ITEM_TYPE_CIRCLE,
    // @ts-ignore
    drop(item: { x: number, y: number, index: number }, monitor) {
      // @ts-ignore
      if (!item.zoom) {
        return
      }
      const delta = monitor.getDifferenceFromInitialOffset()
      const {
        centerX,
        centerY,
      } = transformClickLocation(
        zoomLocation,
        // @ts-ignore
        item.x + delta.x,
        // @ts-ignore
        item.y + delta.y,
        originalImageHeight,
        originalImageWidth,
        imageWidth,
        imageHeight,
        zoomSize,
        ZOOMED_IMAGED_SIZE,
        left,
        top,
      )
      dispatch(updateTag(
        tags[item.index].id,
        tags[item.index].frame_id,
        centerX,
        centerY,
      ))
        .then((result) => {
          if (result !== null) {
            // @ts-ignore
            setTags(update(item.index, result))
          }
        })
    },
  })

  const createCircle = useCallback(
    ({ x, y, id }: { id: number, x: number, y: number }, index: number) => {
      const scaledX = x / originalImageWidth
      const scaledY = y / originalImageHeight
      if (circleInZoomArea(
        zoomSize,
        scaledX,
        scaledY,
        zoomLocation,
        imageWidth,
        imageHeight,
      )) {
        const newX = (scaledX - zoomLocation[0]) * ZOOMED_IMAGED_SIZE * (imageWidth / zoomSize)
        const newY = (scaledY - zoomLocation[1]) * ZOOMED_IMAGED_SIZE * (imageHeight / zoomSize)

        return (
          <Circle
            locked={locked}
            zoom
            x={window.scrollX + left + newX}
            y={window.scrollY + top + newY}
            index={index}
            id={id}
            key={index}
            circleRadius={3}
          />
        )
      }
      return ''
    }, [originalImageHeight, originalImageWidth, zoomLocation, locked, left, top, imageHeight,
      imageWidth, zoomSize],
  )

  const backgroundSize = useBackgroundSize(
    zoomSize,
    imageHeight,
    imageWidth,
  )
  const backgroundPosition = useBackgroundPosition(
    zoomSize,
    zoomLocation,
    imageHeight,
    imageWidth,
  )

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (choosingZoom || frame.locked || zoomLocation === null) {
      setChoosingZoom(false)
      return
    }
    e.preventDefault()
    const {
      centerX,
      centerY,
    } = transformClickLocation(
      zoomLocation,
      e.pageX,
      e.pageY,
      originalImageHeight,
      originalImageWidth,
      imageWidth,
      imageHeight,
      zoomSize,
      ZOOMED_IMAGED_SIZE,
      left,
      top,
    )

    dispatch(commitTag(frame.id, centerX, centerY))
      .then((result) => {
        if (result !== null) {
          // @ts-ignore
          setTags((oldClicks) => append(result, oldClicks))
        }
      })
  }

  const renderedTags = useMemo(() => (
    tags.map(createCircle)
  ), [createCircle, tags])

  const loadedSrc = useLoadedImageSrc(url, imageLoad)

  return (
    <div ref={dropZoom} className={classes.root}>
      <div
        ref={ref}
        onClick={onClick}
        className={classes.zoomedImage}
        style={{
          backgroundImage: loadedSrc,
          backgroundSize,
          backgroundPosition,
        }}
      />
      {renderedTags}
    </div>
  )
}

export default React.memo(ZoomedImage)
