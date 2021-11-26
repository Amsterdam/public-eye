// @ts-nocheck
import React, { useMemo } from 'react'
import ChartCard from './ChartCard'
import {
  LogDataRow,
  buildChartData,
} from './utils'

type DensityLossChartProps = {
  logData: LogDataRow[],
}

const DensityLossChart = ({ logData }: DensityLossChartProps): React.ReactNode => {
  const dataMae = useMemo(() => (
    buildChartData(
      logData,
      [
        { key: 'mae', title: 'Val MAE' },
        { key: 'avg_loss', title: 'Train MAE' },
      ],
    )
  ), [logData])

  const dataMse = useMemo(() => (
    buildChartData(
      logData,
      [
        { key: 'mse', title: 'mse' },
      ],
    )
  ), [logData])

  return (
    <>
      <ChartCard
        title="Validation Loss (MAE)"
        data={dataMae}
      />
      <ChartCard
        title="Validation Loss (MSE)"
        data={dataMse}
      />
    </>
  )
}

export default DensityLossChart
