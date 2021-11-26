// @ts-nocheck
import React, { memo, useCallback, useMemo } from 'react'
import { useThunkDispatch } from 'store'
import { useSelector } from 'react-redux'
import { RootState } from 'reducers'
import LogViewer from 'common/LogViewer'
import JsonViewer from 'common/JsonViewer'
import JobActionButton from 'common/JobActionButton'
import stopJob from 'thunks/jobs/stopJob'
import killJob from 'thunks/jobs/killJob'
import getJobById from 'thunks/jobs/getJobById'
import deleteJob from 'thunks/jobs/deleteJob'
import { Job } from 'types'
import { useSelectedId } from 'utils'
import InfoMarkdown from 'common/InfoMarkdown'
import EmptyFallbackElement from 'common/EmptyFallbackElement'
import ContentContainer from 'common/ContentContainer'

const useJob = (jobId: string | null): Job | undefined => {
  const dispatch = useThunkDispatch()
  const [job, setJob] = React.useState<Job | undefined>(undefined)

  React.useEffect(() => {
    let mounted = true

    if (jobId) {
      dispatch(getJobById(Number(jobId)))
        .then((result) => {
          if (result && mounted) {
            setJob(result)
          }
        })
    }

    return () => {
      mounted = false
    }
  }, [dispatch, jobId])

  return job
}

const JobInfo = (): React.ReactElement => {
  const selectedId = useSelectedId(['/jobs/:id'])
  const job = useJob(selectedId)
  const roles = useSelector((state: RootState) => state.general.userAuth.roles)
  const payload = job ? job.job_script_payload : ''
  const dispatch = useThunkDispatch()

  const fabTitle = useMemo(() => (
    job && job.job_status === 'running'
      ? 'stop job'
      : 'delete'
  ), [job])

  const alertDialogTitle = useMemo(() => (
    job && job.job_status === 'running'
      ? 'Stop the job'
      : 'Delete the job'
  ), [job])

  const fabAction = useMemo(() => {
    if (job && job.job_status === 'running') {
      return () => dispatch(stopJob(job.id))
    }
    return () => dispatch(deleteJob(job.id))
  }, [job, dispatch])

  const commitKill = useCallback(() => {
    if (job && job.id) {
      dispatch(killJob(job.id))
    }
  }, [job, dispatch])

  return (
    <ContentContainer>
      <EmptyFallbackElement
        isEmpty={job === undefined}
        fallbackElement={(
          <InfoMarkdown file="/markdowns/jobs.md" />
        )}
      >
        {
          job !== undefined
            ? (
              <>
                <JsonViewer
                  title="Job Payload"
                  json={payload}
                />
                <LogViewer
                  jobId={job.id}
                  jobStatus={job.job_status}
                />
                <JobActionButton
                  fabAction={fabAction}
                  fabTitle={fabTitle}
                  disabled={false}
                  dialogTitle={alertDialogTitle}
                />
                {
                  roles.includes('admin')
                  && (
                    <JobActionButton
                      fabAction={commitKill}
                      fabTitle="kill job"
                      disabled={!job || job.job_status !== 'running'}
                      dialogTitle="Kill this job (DANGEROUS)"
                      bottom={30}
                      right={150}
                    />
                  )
                }

              </>
            ) : (
              <div />
            )
        }

      </EmptyFallbackElement>
    </ContentContainer>
  )
}

export default memo(JobInfo)
