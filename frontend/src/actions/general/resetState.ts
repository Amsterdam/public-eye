export const RESET_STATE = 'RESET_STATE'

export type ResetStateAction = {
  type: string
}

const resetState = (): ResetStateAction => ({
  type: RESET_STATE,
})

export default resetState
