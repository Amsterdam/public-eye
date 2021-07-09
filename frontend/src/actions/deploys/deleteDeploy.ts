export const DELETE_DEPLOY = 'DELETE_DEPLOY'
export type DeleteDeploy = {
  type: string,
  id: number,
}

const deleteDeploy = (id: number): DeleteDeploy => ({
  type: DELETE_DEPLOY,
  id,
})

export default deleteDeploy
