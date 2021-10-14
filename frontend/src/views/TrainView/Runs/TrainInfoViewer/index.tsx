import React, {
  useEffect, useState, useCallback, useMemo,
} from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import LogViewer from 'common/LogViewer'
import stopJob from 'thunks/jobs/stopJob'
import deleteTrainingRun from 'thunks/training/deleteTrainingRun'
import setInfo from 'actions/general/setInfo'
import JsonViewer from 'common/JsonViewer'
import JobActionButton from 'common/JobActionButton'
import { TrainingRun } from 'types'
import ContentContainer from 'common/ContentContainer'
import EmptyFallbackElement from 'common/EmptyFallbackElement'
import { useSelectedId } from 'utils'
import InfoMarkdown from 'common/InfoMarkdown'
import getTrainingRunByJobId from 'thunks/training/getTrainingRunByJobId'
import { RootState } from 'reducers'
import LossChart from './LossChart'
import TrainConfig from '../../TrainConfig'
import ScoreCard from '../../ScoreCard'
import DatasetCard from './DatasetCard'

const InfoViewFab = ({ trainingRun }: { trainingRun: TrainingRun }) => {
  const dispatch = useThunkDispatch()
  const history = useHistory()
  const [cancelSubmitted, setCancelSubmitted] = useState(false)

  const fabAction = useCallback(async () => {
    if (trainingRun.job_status === 'running') {
      const success = await dispatch(stopJob(trainingRun.job_id))

      if (success) {
        setCancelSubmitted(true)
        dispatch(setInfo(true, 'Submit cancelling of the training run'))
      }
    } else {
      dispatch(deleteTrainingRun(trainingRun))
        .then(() => history.push('/train/runs'))
    }
  }, [dispatch, history, trainingRun])

  const fabTitle = useMemo(() => (
    trainingRun.job_status === 'running' ? 'Stop training' : 'delete'), [trainingRun.job_status])

  const alertDialogTitle = useMemo(() => (
    trainingRun.job_status === 'running'
      ? 'Stop training'
      : 'Delete the selected run'
  ), [trainingRun.job_status])

  useEffect(() => {
    setCancelSubmitted(false)
  }, [trainingRun.id, trainingRun.job_status])

  return (
    <JobActionButton
      fabAction={fabAction}
      fabTitle={fabTitle}
      disabled={cancelSubmitted}
      dialogTitle={alertDialogTitle}
    />
  )
}

const useTrainingRun = (runId: string | null): TrainingRun | undefined => {
  const dispatch = useThunkDispatch()
  const trainingRun = useSelector((state: RootState) => (
    state.training.trainingRunsCache.get(Number(runId))))

  React.useEffect(() => {
    if (runId) {
      dispatch(getTrainingRunByJobId(Number(runId)))
    }
  }, [runId, dispatch])

  return trainingRun
}

const InfoViewer = (): React.ReactElement => {
  const selectedTrainingRunId = useSelectedId(['/train/runs/:id'])
  const selectedTrainingRun = useTrainingRun(selectedTrainingRunId)

  return (
    <ContentContainer>
      <EmptyFallbackElement
        isEmpty={selectedTrainingRunId === undefined}
        fallbackElement={<InfoMarkdown file="/markdowns/train.md" />}
      >
        {
          selectedTrainingRun !== undefined
          && (
            <>
              <TrainConfig
                configId={selectedTrainingRun.config_id}
              />
              <LogViewer
                jobId={selectedTrainingRun.job_id}
              />
              <LossChart
                jobStatus={selectedTrainingRun.job_status}
                nnType={selectedTrainingRun.nn_type}
                runId={selectedTrainingRun.id}
              />
              <JsonViewer
                title="Job Payload"
                json={selectedTrainingRun.job_script_payload}
              />
              <ScoreCard
                trainingRunId={selectedTrainingRun.id}
                jobStatus={selectedTrainingRun.job_status}
              />
              <InfoViewFab trainingRun={selectedTrainingRun} />
              <DatasetCard
                jobPayload={selectedTrainingRun.job_script_payload}
              />
            </>
          )
        }
      </EmptyFallbackElement>
    </ContentContainer>
  )
}

export default React.memo(InfoViewer)
