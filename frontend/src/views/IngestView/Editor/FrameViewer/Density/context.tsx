import React from 'react'
import { FrameTag } from 'types'

export const ZOOM_SIZE = 50

type ContextType = {
  zoomLocation: [[number, number], React.Dispatch<React.SetStateAction<[number, number]>>],
  choosingZoom: [boolean, React.Dispatch<React.SetStateAction<boolean>>],
  tags: [FrameTag[], React.Dispatch<React.SetStateAction<FrameTag[]>>],
  identifiers: [boolean, React.Dispatch<React.SetStateAction<boolean>>],
  selectedTagId: [number | null, React.Dispatch<React.SetStateAction<number | null>>],
  renderedImageSize: [
    { top: number, left: number, width: number, height: number },
    React.Dispatch<
    React.SetStateAction<{ top: number, left: number, width: number, height: number }>
    >,
  ],
  originalImageSize: [[number, number], React.Dispatch<React.SetStateAction<[number, number]>>],
  zoomSize: [number, React.Dispatch<React.SetStateAction<number>>],
}

// @ts-ignore
export const StoreContext = React.createContext<ContextType>()

const StoreProvider = ({
  children,
}: {
  children: React.ReactElement,
}): JSX.Element => {
  const [zoomLocation, setZoomLocation] = React.useState<[number, number] | null>(null)
  const [choosingZoom, setChoosingZoom] = React.useState(false)
  const [hideIdentifiers, setHideIdentifers] = React.useState(true)
  const [tags, setTags] = React.useState<FrameTag[]>([])
  const [selectedTagId, setSelectedTagId] = React.useState<number | null>(null)
  const [originalImageSize, setOriginalImageSize] = React.useState([0, 0])
  const [renderedImageSize, setRenderedImageSize] = React.useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  })
  const [zoomSize, setZoomSize] = React.useState(ZOOM_SIZE)

  const store = {
    zoomLocation: [zoomLocation, setZoomLocation],
    choosingZoom: [choosingZoom, setChoosingZoom],
    tags: [tags, setTags],
    identifiers: [hideIdentifiers, setHideIdentifers],
    selectedTagId: [selectedTagId, setSelectedTagId],
    renderedImageSize: [renderedImageSize, setRenderedImageSize],
    originalImageSize: [originalImageSize, setOriginalImageSize],
    zoomSize: [zoomSize, setZoomSize],
  }

  // @ts-ignore
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export { StoreProvider }
