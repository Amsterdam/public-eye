import React from 'react'
import {
  Box,
} from '@material-ui/core'
import PageContainer from 'common/PageContainer'
import InfoMarkdown from 'common/InfoMarkdown'

const HomeView = (): JSX.Element => (
  <PageContainer>
    <Box padding={2}>
      <InfoMarkdown file="/markdowns/home.md" />
    </Box>
  </PageContainer>
)

export default HomeView
