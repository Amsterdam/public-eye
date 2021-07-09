export const DELETE_JOB = 'DELETE_JOB'
export type DeleteJob = {
  type: string,
  id: number,
}

const deleteJob = (id: number): DeleteJob => ({
  type: DELETE_JOB,
  id,
})

export default deleteJob
