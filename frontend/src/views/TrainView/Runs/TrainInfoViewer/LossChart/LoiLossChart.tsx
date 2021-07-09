import React, { useMemo } from 'react'
import ChartCard from './ChartCard'
import {
  LogDataRow,
  buildChartData,
} from './utils'

type LoiLossChartProps = {
  logData: LogDataRow[],
}

const LoiLossChart = ({ logData }: LoiLossChartProps): React.ReactNode => {
  const dataMae = useMemo(() => (
    buildChartData(
      logData,
      [
        { key: 'mae', title: 'MAE' },
        { key: 'rmse', title: 'RMSE' },
      ],
    )
  ), [logData])

  const dataMse = useMemo(() => (
    buildChartData(
      logData,
      [
        { key: 'loss', title: 'Loss' },
      ],
    )
  ), [logData])

  return (
    <>
      <ChartCard
        title="Validation MAE & RMSE"
        data={dataMae}
      />
      <ChartCard
        title="Validation Loss"
        data={dataMse}
      />
    </>
  )
}

export default LoiLossChart
