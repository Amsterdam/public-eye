import { ChartDataRow } from 'types'

export const ADD_CHART_DATA_ROW = 'ADD_CHART_DATA_ROW'
export type AddChartDataRow = {
  type: string,
  row: ChartDataRow,
  jobId: number,
  selectedId: number,
}

const addChartDataRow = (
  selectedId: number,
  jobId: number,
  row: ChartDataRow,
): AddChartDataRow => ({
  type: ADD_CHART_DATA_ROW,
  selectedId,
  row,
  jobId,
})

export default addChartDataRow
