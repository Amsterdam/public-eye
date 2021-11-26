import React, { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import Box from '@material-ui/core/Box'
import JobActionButton from 'common/JobActionButton'
import deleteDeploy from 'thunks/deploys/deleteDeploy'
import stopJob from 'thunks/jobs/stopJob'
import LogViewer from 'common/LogViewer'
import { Deploy } from 'types'
import StreamPlayer from './StreamPlayer'

const StreamInstanceView = ({
  streamInstance,
}: {
  streamInstance: Deploy
}): JSX.Element => {
  const dispatch = useDispatch()
  const fabTitle = useMemo(() => (
    streamInstance.job_status === 'running' ? 'Stop deploy' : 'delete'), [streamInstance.job_status])

  const alertDialogTitle = useMemo(() => (
    streamInstance.job_status === 'running'
      ? 'Stop the stream instance'
      : 'Delete the stream instance'
  ), [streamInstance.job_status])

  const fabAction = useMemo(() => {
    if (streamInstance.job_status === 'running') {
      return () => dispatch(stopJob(streamInstance.id))
    }
    return () => dispatch(deleteDeploy(streamInstance))
  }, [streamInstance, dispatch])

  return (
    <Box
      flexGrow={1}
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      display="flex"
    >
      <>
        <Box
          width="85%"
        >
          {
            streamInstance.job_status === 'running' && <StreamPlayer url={streamInstance.output_stream_path} />
          }
          <LogViewer
            jobId={streamInstance.id}
            // @ts-ignore
            jobStatus={streamInstance.job_status}
          />
        </Box>
        {/* @ts-ignore */}
        <JobActionButton
          fabAction={fabAction}
          fabTitle={fabTitle}
          disabled={false}
          dialogTitle={alertDialogTitle}
        />
      </>
    </Box>
  )
}

export default StreamInstanceView
