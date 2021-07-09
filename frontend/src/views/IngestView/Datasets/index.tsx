import React from 'react'
import PageContainer from 'common/PageContainer'
import ContentContainer from 'common/ContentContainer'
import DatasetViewer from './DatasetViewer'
import DatasetNavigator from './DatasetNavigator'

const Datasets = (): React.ReactElement => (
  <PageContainer>
    <DatasetNavigator />
    <ContentContainer>
      <DatasetViewer />
    </ContentContainer>
  </PageContainer>
)

export default Datasets
