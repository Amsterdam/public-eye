import React, { useState } from 'react'
import PageContainer from 'common/PageContainer'
import ContentContainer from 'common/ContentContainer'
import Editor from '../Editor'
import CollectionsNavigatorBody from './CollectionsNavigator'

const Collections = (): JSX.Element => {
  const [framesPage, setFramesPage] = useState(1)

  return (
    <PageContainer>
      <CollectionsNavigatorBody
        framesPage={framesPage}
        // @ts-ignore
        setFramesPage={setFramesPage}
      />
      <ContentContainer>
        <Editor />
      </ContentContainer>
    </PageContainer>
  )
}

export default Collections
