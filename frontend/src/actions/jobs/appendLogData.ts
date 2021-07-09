export const APPEND_LOG_DATA = 'APPEND_LOG_DATA'
export type AppendLogData = {
  type: string,
  jobId: number,
  data: string,
}

const appendLogData = (
  jobId: number, data: string,
): AppendLogData => ({
  type: APPEND_LOG_DATA,
  jobId,
  data,
})

export default appendLogData
