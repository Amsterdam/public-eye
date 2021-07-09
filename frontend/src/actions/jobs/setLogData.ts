export const SET_LOG_DATA = 'SET_LOG_DATA'
export type SetLogData = {
  type: string,
  jobId: number,
  data: string,
}

const setLogData = (
  jobId: number, data: string,
): SetLogData => ({
  type: SET_LOG_DATA,
  jobId,
  data,
})

export default setLogData
