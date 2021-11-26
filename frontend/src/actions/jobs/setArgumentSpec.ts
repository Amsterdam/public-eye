export const SET_ARGUMENT_SPEC = 'SET_ARGUMENT_SPEC'
export type SetArgumentsSpec = {
  type: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  argumentSpec: Record<string, any>,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setArgumentSpec = (argumentSpec: Record<string, any>): SetArgumentsSpec => ({
  type: SET_ARGUMENT_SPEC,
  argumentSpec,
})

export default setArgumentSpec
