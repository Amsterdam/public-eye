// @ts-nocheck
import React, { useMemo } from 'react'
import ChartCard from './ChartCard'
import {
  LogDataRow,
  buildChartData,
} from './utils'

type ObjectLossChartProps = {
  logData: LogDataRow[],
}

const ObjectLossChart = ({ logData }: ObjectLossChartProps): React.ReactNode => {
  const dataMae = useMemo(() => (
    buildChartData(
      logData,
      [
        { key: 'F1', title: 'F1' },
        { key: 'mAP', title: 'mAP' },
        { key: 'Precision', title: 'Precision' },
        { key: 'Recall', title: 'Recall' },
      ],
    )
  ), [logData])

  const dataMse = useMemo(() => (
    buildChartData(
      logData,
      [
        { key: 'GIoU', title: 'GIoU' },
        { key: 'Objectness', title: 'Objectness' },
        { key: 'Classification', title: 'Classification' },
        { key: 'Trainloss', title: 'Trainloss' },
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

export default ObjectLossChart
