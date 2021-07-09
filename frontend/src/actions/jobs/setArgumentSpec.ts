export const SET_ARGUMENT_SPEC = 'SET_ARGUMENT_SPEC'
export type SetArgumentsSpec = {
  type: string,
  argumentSpec: Record<string, any>,
}

const setArgumentSpec = (argumentSpec: Record<string, any>): SetArgumentsSpec => ({
  type: SET_ARGUMENT_SPEC,
  argumentSpec,
})

export default setArgumentSpec
