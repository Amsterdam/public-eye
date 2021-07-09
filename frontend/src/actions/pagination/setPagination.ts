export const SET_PAGINATION = 'SET_PAGINATION'
export type SetPagination = {
  type: string,
  itemType: string,
  total: number,
}

const setPagination = (itemType: string, total: number): SetPagination => ({
  type: SET_PAGINATION,
  itemType,
  total,
})

export default setPagination
