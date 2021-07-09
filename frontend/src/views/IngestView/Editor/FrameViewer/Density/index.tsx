import React from 'react'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import * as R from 'ramda'
import {
  Box,
} from '@material-ui/core'
import commitTag from 'thunks/tags/commitTag'
import getTags from 'thunks/tags/getTags'
import { getToken } from 'utils'
import { RootState } from 'reducers'
import { Frame } from 'types'
import { StoreContext, StoreProvider } from './context'
import ActionRow from './ActionRow'
import ZoomedImage from './ZoomedImage'
import ImageViewer from './ImageViewer'

export const addScrollX = (value: number): number => value + window.scrollX
export const addScrollY = (value: number): number => value + window.scrollY

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

const Density = ({
  frame,
}: {
  frame: Frame,
}): React.ReactElement => {
  const {
    selectedTagId: [, setTagSelected],
    tags: [, setTags],
    choosingZoom: [choosingZoom, setChoosingZoom],
    originalImageSize: [, setOriginalImageSize],
  } = React.useContext(StoreContext)

  const baseUrl = useSelector((state: RootState) => state.general.baseUrl)
  const token = getToken()
  const url = React.useMemo(() => (
    `${baseUrl}/files/frames/${String(frame.id)}?tk=${token}`
  ), [baseUrl, frame.id, token])

  const { width: originalImageWidth, height: originalImageHeight } = useImageSize(url)

  React.useEffect(() => {
    setOriginalImageSize([originalImageWidth, originalImageHeight])
  }, [setOriginalImageSize, originalImageWidth, originalImageHeight])

  const dispatch = useThunkDispatch()

  const handleClick = (
    calculateX = (value: number): number => value,
    calculateY = (value: number): number => value,
  ) => async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (choosingZoom || frame.locked) {
      setChoosingZoom(false)
      return
    }
    e.preventDefault()
    const centerX = calculateX(e.clientX)
    const centerY = calculateY(e.clientY)

    dispatch(commitTag(frame.id as number, centerX, centerY))
      .then((result) => {
        if (result !== null) {
          setTags((oldClicks) => R.append(result, oldClicks))
        }
      })
  }

  React.useEffect(() => {
    setTagSelected(null)
    dispatch(getTags(frame.id as number))
      .then((newTags) => {
        if (newTags !== null) {
          setTags(newTags)
        }
      })
  }, [frame.id, dispatch, setTags, setTagSelected])

  return (
    <Box
      display="flex"
      flexDirection="column"
    >
      <Box
        display="flex"
        justifyContent="space-between"
        paddingTop={3}
        paddingBottom={3}
      >
        <ImageViewer
          handleClick={handleClick}
          url={url}
          locked={frame.locked}
        />
        <ZoomedImage
          frame={frame}
          url={url}
          locked={frame.locked}
        />
      </Box>
      <ActionRow frame={frame} />
    </Box>
  )
}

const WrapContext = ({
  frame,
}: {
  frame: Frame,
}) => (
  <StoreProvider>
    <Density frame={frame} />
  </StoreProvider>
)

export default React.memo(WrapContext)
