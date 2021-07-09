import React, { useMemo, memo } from 'react'
import { useThunkDispatch } from 'store'
import LogViewer from 'common/LogViewer'
import stopJob from 'thunks/jobs/stopJob'
import JobActionButton from 'common/JobActionButton'
import deleteDeploy from 'thunks/deploys/deleteDeploy'
import { Deploy } from 'types'
import Box from '@material-ui/core/Box'

const MultiCaptureView = ({
  multiCapture,
}: {
  multiCapture: Deploy,
}) => {
  const dispatch = useThunkDispatch()
  const fabTitle = useMemo(() => (multiCapture.job_status === 'running' ? 'Stop deploy' : 'delete'), [multiCapture.job_status])

  const alertDialogTitle = useMemo(() => (
    multiCapture.job_status === 'running'
      ? 'Stop the stream instance'
      : 'Delete the stream instance'
  ), [multiCapture.job_status])

  const fabAction = useMemo(() => {
    if (multiCapture.job_status === 'running') {
      return () => dispatch(stopJob(multiCapture.id))
    }
    return () => dispatch(deleteDeploy(multiCapture))
  }, [multiCapture, dispatch])

  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexGrow={1}
      >
        <LogViewer
          jobId={multiCapture.id}
          jobStatus={multiCapture.job_status}
        />
      </Box>
      <JobActionButton
        fabAction={fabAction}
        fabTitle={fabTitle}
        disabled={false}
        dialogTitle={alertDialogTitle}
      />
    </>
  )
}

export default memo(MultiCaptureView)
