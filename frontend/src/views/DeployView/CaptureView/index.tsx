import React from 'react'
import { useThunkDispatch } from 'store'
import {
  Box,
} from '@material-ui/core'
import { Deploy } from 'types'
import ContentContainer from 'common/ContentContainer'
import JobActionButton from 'common/JobActionButton'
import LogViewer from 'common/LogViewer'
import stopJob from 'thunks/jobs/stopJob'
import deleteDeploy from 'thunks/deploys/deleteDeploy'
import StreamPlayer from '../StreamInstanceView/StreamPlayer'

const CaptureView = ({
  capture,
}: {
  capture: Deploy,
}): JSX.Element => {
  const dispatch = useThunkDispatch()
  const fabTitle = React.useMemo(() => (
    capture.job_status === 'running' ? 'Stop deploy' : 'delete'
  ), [capture.job_status])

  const alertDialogTitle = React.useMemo(() => (
    capture.job_status === 'running'
      ? 'Stop the deploy'
      : 'Delete the deploy'
  ), [capture.job_status])

  const fabAction = React.useMemo(() => {
    if (capture.job_status === 'running') {
      return () => dispatch(stopJob(capture.id))
    }
    return () => dispatch(deleteDeploy(capture))
  }, [capture, dispatch])

  return (
    <ContentContainer>
      <Box
        width="85%"
      >
        {
          capture.job_status === 'running'
          && <StreamPlayer url={capture.output_stream_path} />
        }
        <LogViewer
          jobId={capture.id}
          // @ts-ignore
          jobStatus={capture.job_status}
        />
      </Box>
      {/* @ts-ignore */}
      <JobActionButton
        fabAction={fabAction}
        fabTitle={fabTitle}
        dialogTitle={alertDialogTitle}
        disabled={false}
      />
    </ContentContainer>
  )
}

export default CaptureView
