import React, { memo } from 'react'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import { useMountEffect } from 'utils'
import getAllJobs from 'thunks/jobs/getAllJobs'
import PageContainer from 'common/PageContainer'
import { RootState } from 'reducers'
import Navigator from './Navigator'
import JobInfo from './JobInfo'

const JobsView = (): React.ReactElement => {
  const dispatch = useThunkDispatch()
  const jobs = useSelector((state: RootState) => state.jobs.jobs)

  useMountEffect(() => {
    dispatch(getAllJobs())
  })

  return (
    <PageContainer>
      <Navigator jobs={jobs} />
      <JobInfo />
    </PageContainer>
  )
}

export default memo(JobsView)
