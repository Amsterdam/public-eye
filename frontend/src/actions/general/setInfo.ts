export const SET_INFO = 'SET_INFO'
type SEVERITY = 'error' | 'info' | 'success' | 'warning' | undefined
export type SetInfo = {
  type: string,
  open: boolean,
  message: string,
  severity: SEVERITY,
}

const setInfo = (
  open: boolean, message: string, severity = 'info',
): SetInfo => ({
  type: SET_INFO,
  open,
  message,
  severity: severity as SEVERITY,
})

export default setInfo
