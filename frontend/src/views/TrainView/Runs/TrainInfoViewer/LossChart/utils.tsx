import {
  any,
  prepend,
} from 'ramda'

export type LogDataRow = Record<string, number>
export type Row = string[] | number[]
type HeaderItem = { key: string, title: string }

export const buildChartData = (logData: LogDataRow[], header: HeaderItem[]): Row[] => {
  const mapRow = (row: LogDataRow, index: number): Row => {
    const dataRow: number[] = header.map(
      ({ key }: { key: string }): number => row[key] || 0,
    )
    return [index + 1, ...dataRow]
  }
  const logDataWithIndex: Row[] = logData.map(mapRow)

  const filterFunc = (row: Row) => !any((x) => x === undefined || x === null)(row)

  const filtered: Row[] = logDataWithIndex.filter(filterFunc)

  if (filtered.length > 0) {
    const headerTitles: Row = ['x', ...header.map(({ title }) => title)] as Row
    return prepend(headerTitles)(filtered)
  }
  return []
}
