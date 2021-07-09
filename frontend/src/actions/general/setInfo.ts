export const SET_INFO = 'SET_INFO'
export type SetInfo = {
  type: string,
  open: boolean,
  message: string,
  severity: string,
}

const setInfo = (
  open: boolean, message: string, severity = 'info',
): SetInfo => ({
  type: SET_INFO,
  open,
  message,
  severity,
})

export default setInfo
