import { ChartDataRow } from 'types'

export const SET_CHART_DATA = 'SET_CHART_DATA'
export type SetChartData = {
  type: string,
  chartData: ChartDataRow[],
}

const setChartData = (chartData: ChartDataRow[]): SetChartData => ({
  type: SET_CHART_DATA,
  chartData,
})

export default setChartData
