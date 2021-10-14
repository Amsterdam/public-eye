import React, { useEffect, memo } from 'react'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import getTrainingLog from 'thunks/training/getTrainingLog'
import { RootState } from 'reducers'
import DensityLossChart from './DensityLossChart'
import ObjectLossChart from './ObjectLossChart'
import LoiLossChart from './LoiLossChart'

type LossChartProps = {
  nnType: string,
  runId: number,
  jobStatus: string,
}

const LossChart = (props: LossChartProps) => {
  const {
    nnType,
    runId,
    jobStatus,
  } = props

  const dispatch = useThunkDispatch()
  const logData = useSelector((state: RootState) => state.training.chartData)

  useEffect(() => {
    dispatch(getTrainingLog(runId))
  }, [runId, dispatch, jobStatus])

  if (
    nnType === 'density_estimation'
    || nnType === 'density_estimation_transformer'
  ) {
    return <DensityLossChart logData={logData} />
  }

  if (nnType === 'line_crossing_density') {
    return <LoiLossChart logData={logData} />
  }

  return <ObjectLossChart logData={logData} />
}

export default memo(LossChart)
