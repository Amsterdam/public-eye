import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Box from '@material-ui/core/Box'
import { DndProvider } from 'react-dnd'
import Backend from 'react-dnd-html5-backend'
import { useSelectedId, useIngestPath } from 'utils'
import ContentContainer from 'common/ContentContainer'
import InfoMarkdown from 'common/InfoMarkdown'
import VideoPlayer from './VideoPlayer'
import FrameViewer from './FrameViewer'

const useIngestTab = () => {
  const location = useLocation()
  const [tab, setTab] = useState('videos')

  useEffect(() => {
    const splitted = location.pathname.split('/')

    if (splitted.length > 2) {
      setTab(splitted[2])
    } else {
      setTab('videos')
    }
  }, [location.pathname])

  return tab
}

const Editor = (): JSX.Element => {
  const selectedId = useSelectedId(['/ingest/videos/:id'])
  const tab = useIngestTab()
  const { frameId } = useIngestPath()

  const content = useMemo(() => {
    if (frameId) {
      return (
        <DndProvider backend={Backend}>
          <FrameViewer />
        </DndProvider>
      )
    }
    if (selectedId !== null && tab === 'videos') {
      return <VideoPlayer id={selectedId} />
    }
    return (
      <InfoMarkdown file="/markdowns/ingest.md" />
    )
  }, [selectedId, frameId, tab])

  return (
    <ContentContainer>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexGrow={1}
      >
        {
          content
        }
      </Box>
    </ContentContainer>
  )
}

export default Editor
