import React, { memo } from 'react'
import PageContainer from 'common/PageContainer'
import Navigator from './Navigator'
import JobInfo from './JobInfo'

const JobsView = (): JSX.Element => (
  <PageContainer>
    <Navigator />
    <JobInfo />
  </PageContainer>
)

export default memo(JobsView)
