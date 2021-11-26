// @ts-nocheck
import React, { useState } from 'react'
import PageContainer from 'common/PageContainer'
import ContentContainer from 'common/ContentContainer'
import VideosNavigatorBody from './VideosNavigator'
import Editor from '../Editor'

const Videos = (): JSX.Element => {
  const [framesPage, setFramesPage] = useState(1)

  return (
    <PageContainer>
      <VideosNavigatorBody
        framesPage={framesPage}
        setFramesPage={setFramesPage}
      />
      <ContentContainer>
        <Editor />
      </ContentContainer>
    </PageContainer>
  )
}

export default Videos
