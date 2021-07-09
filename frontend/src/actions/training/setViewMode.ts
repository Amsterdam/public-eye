export const SET_VIEW_MODE = 'SET_VIEW_MODE'
export type SetViewMode = {
  type: string,
  viewMode: number,
}

const setViewMode = (viewMode: number): SetViewMode => ({
  type: SET_VIEW_MODE,
  viewMode,
})

export default setViewMode
