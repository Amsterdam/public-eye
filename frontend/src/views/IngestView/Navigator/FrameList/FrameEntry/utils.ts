// @ts-nocheck
import React from 'react'
import { Frame } from 'types'
import { getFileName } from 'utils'

const getTime = (timestamp: number): string => {
  const d = new Date(timestamp)
  const pad = (t: number) => (x: number) => x.toString().padStart(t)
  return `${pad(2)(d.getUTCHours())}:${pad(2)(d.getMinutes())}:${pad(2)(d.getSeconds())}:${pad(3)(d.getMilliseconds())}`
}

const createTitle = (frame: Frame): string => {
  if (frame.ts_vid) {
    return getTime(frame.ts_vid)
  }
  if (frame.ts_utc) {
    return (new Date(frame.ts_utc)).toString()
  }
  return getFileName(frame.path)
}

export const useTitle = (frame: Frame): string => React.useMemo<string>(() => (
  createTitle(frame)
), [frame])

export default {
  useTitle,
}
