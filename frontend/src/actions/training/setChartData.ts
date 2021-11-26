export const SET_CHART_DATA = 'SET_CHART_DATA'
export type SetChartData = {
  type: string,
  chartData: (number[] | string[])[],
}

const setChartData = (chartData: (number[] | string[])[]): SetChartData => ({
  type: SET_CHART_DATA,
  chartData,
})

export default setChartData
