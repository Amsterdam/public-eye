import React from 'react'
import PageContainer from 'common/PageContainer'
import TrainInfoViewer from './TrainInfoViewer'
import Navigator from './Navigator'

const Runs = (): JSX.Element => (
  <PageContainer>
    <Navigator />
    <TrainInfoViewer />
  </PageContainer>
)

export default Runs
