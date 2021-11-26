// @ts-nocheck
import React, {
  useState, useRef, useCallback, useEffect, useMemo,
} from 'react'
import { useSelector } from 'react-redux'
import { Box } from '@material-ui/core'
import { useThunkDispatch } from 'store'
import { getToken } from 'utils'
import getBoundingBoxes from 'thunks/frames/getBoundingBoxes'
import { RootState } from 'reducers'
import { BoundingBox as BoundingBoxType, Frame } from 'types'
import BoundingBox from './BoundingBox'
import ActionRow from './ActionRow'

type Coord = {
  x: number,
  y: number,
}

const ObjectRecognition = ({
  setWidth,
  width,
  frame,
}: {
  setWidth: () => null,
  width: number,
  frame: Frame,
}): React.ReactElement => {
  const dispatch = useThunkDispatch()
  const imgRef = useRef<HTMLImageElement>(null)
  const [imageWidth, setImageWidth] = useState(null)
  const [imageHeight, setImageHeight] = useState(null)
  const [imgLeft, setImgLeft] = useState(0)
  const [imgTop, setImgTop] = useState(0)
  const scalingFactor = 1
  const token = getToken()
  const baseUrl = useSelector((state: RootState) => state.general.baseUrl)
  const url = `${baseUrl}/files/frames/${String(frame.id)}?tk=${token}`
  const [firstPositionCoords, setFirstPositionCoords] = useState<Coord | null>(null)
  const [secondPositionCoords, setSecondPositionCoords] = useState<Coord | null>(null)
  const [mouseLocation, setMouseLocation] = useState(null)
  const [selectedBoundingBox, setSelectedBoundingBox] = useState(null)

  const calculateX = useCallback((value) => {
    const { left } = imgRef.current.getBoundingClientRect()
    return Math.round((value - (left)) / scalingFactor)
  }, [scalingFactor])

  const calculateY = useCallback((value) => {
    const { top } = imgRef.current.getBoundingClientRect()
    return Math.round((value - (top)) / scalingFactor)
  }, [scalingFactor])

  const handleClickCommit = useCallback((clientX, clientY) => {
    const centerX = calculateX(clientX)
    const centerY = calculateY(clientY)

    if (firstPositionCoords === null) {
      setFirstPositionCoords({ x: centerX, y: centerY })
    } else if (secondPositionCoords !== null) {
      setFirstPositionCoords(null)
      setSecondPositionCoords(null)
    } else {
      setSecondPositionCoords({ x: centerX, y: centerY })
    }
  }, [firstPositionCoords, secondPositionCoords, calculateX, calculateY])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const { left: imgLeftTemp, top: imgTopTemp } = imgRef.current.getBoundingClientRect()
    const adjustedX = ((e.clientX - imgLeftTemp) / scalingFactor)
    const adjustedY = ((e.clientY - imgTopTemp) / scalingFactor)
    setMouseLocation({ x: adjustedX, y: adjustedY })
    e.persist()
  }, [scalingFactor])

  const imageClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (selectedBoundingBox) {
      setSelectedBoundingBox(null)
      return
    }

    handleClickCommit(e.clientX, e.clientY)
  }, [handleClickCommit, selectedBoundingBox])

  const [boundingBoxes, setBoundingBoxes] = useState([])

  const resize = useCallback(() => {
    setFirstPositionCoords(null)
    setSecondPositionCoords(null)

    if (imgRef && imgRef.current) {
      const {
        left, top, width: tempWidth, height,
      } = imgRef.current.getBoundingClientRect()

      setImgLeft(left)
      setImgTop(top)
      setImageWidth(tempWidth)
      setImageHeight(height)
    }
  }, [])

  useEffect(() => {
    const img = new Image()
    img.src = url
    img.onload = () => {
      if (imgRef && imgRef.current) {
        const {
          left, top, width: tempWidth, height,
        } = imgRef.current.getBoundingClientRect()

        setImgLeft(left)
        setImgTop(top)
        setImageWidth(tempWidth)
        setImageHeight(height)
      }

      if ((img.width / img.height) < 1.1) {
        setWidth('40%')
      } else {
        setWidth('80%')
      }
    }

    dispatch(getBoundingBoxes(frame.id))
      .then((result) => {
        if (result) {
          setBoundingBoxes(result)
        }
      })
  }, [frame.id, url, dispatch, setWidth])

  const box = useMemo(() => {
    if (firstPositionCoords === null) {
      return ''
    }

    const { left: imgLeftTemp, top: imgTopTemp } = imgRef.current.getBoundingClientRect()

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const secondPositionX = secondPositionCoords
      ? secondPositionCoords.x
      : mouseLocation.x

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const secondPositionY = secondPositionCoords
      ? secondPositionCoords.y
      : mouseLocation.y

    const tempWidth = Math.abs(secondPositionX - firstPositionCoords.x)
    const height = Math.abs(secondPositionY - firstPositionCoords.y)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const left = secondPositionX < firstPositionCoords.x
      ? secondPositionX
      : firstPositionCoords.x

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const top = secondPositionY < firstPositionCoords.y
      ? secondPositionY
      : firstPositionCoords.y

    return (
      <div
        onMouseMove={onMouseMove}
        onClick={imageClick}
        style={{
          left: (left * scalingFactor) + imgLeftTemp,
          top: (top * scalingFactor) + imgTopTemp,
          width: tempWidth * scalingFactor,
          height: height * scalingFactor,
          border: '2px solid rgb(225, 184, 225)',
          position: 'absolute',
        }}
      />
    )
  }, [secondPositionCoords, firstPositionCoords, imageClick,
    mouseLocation, onMouseMove, scalingFactor])

  const boundingBoxFromBackend = useCallback((boundingBox: BoundingBoxType, index: number) => (
    <BoundingBox
      imageHeight={imageHeight}
      imageWidth={imageWidth}
      scalingFactor={scalingFactor}
      imageClick={imageClick}
      boundingBox={boundingBox}
      setSelectedBoundingBox={setSelectedBoundingBox}
      onMouseMove={onMouseMove}
      imgTop={imgTop}
      imgLeft={imgLeft}
      key={index}
      handleClickCommit={handleClickCommit}
      resetCoords={() => {
        setFirstPositionCoords(null)
        setSecondPositionCoords(null)
      }}
    />
  ), [handleClickCommit, imageClick, imageHeight, imageWidth, onMouseMove, scalingFactor,
    imgLeft, imgTop])

  const boundingBoxSelected = boundingBoxes.find((bb) => bb.bb_id === selectedBoundingBox)

  useEffect(() => {
    window.addEventListener('resize', resize)

    return () => window.removeEventListener('resize', resize)
  })

  useEffect(() => {
    resize()
  }, [width, resize])

  return (
    <Box display="flex" flexDirection="column">
      <div
        onClick={imageClick}
        onMouseMove={onMouseMove}
        ref={imgRef}
        style={{
          display: 'flex',
          maxHeight: 'calc(100vh - 320px)',
        }}
      >
        <img
          alt="_object_recogition_image"
          src={url}
          height="auto"
          width="auto"
          style={{
            maxWidth: '100%',
            objectFit: 'scale-down',
            maxHeight: 'calc(100vh - 320px)',
            alignSelf: 'flex-start',
          }}
        />
      </div>
      { box }
      { boundingBoxes.map(boundingBoxFromBackend)}
      <ActionRow
        frameId={frame.id}
        setBoundingBoxes={setBoundingBoxes}
        firstPositionCoords={firstPositionCoords}
        secondPositionCoords={secondPositionCoords}
        imageWidth={imageWidth}
        boundingBoxSelected={boundingBoxSelected}
        imageHeight={imageHeight}
        resetCoords={() => {
          setFirstPositionCoords(null)
          setSecondPositionCoords(null)
        }}
      />
    </Box>
  )
}

export default ObjectRecognition
