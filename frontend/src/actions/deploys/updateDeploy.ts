export const UPDATE_DEPLOY = 'UPDATE_DEPLOY'
export type UpdateDeploy = {
  type: string,
  id: number,
  property: string,
  value: number | string,
}

const updateDeploy = (
  id: number, property: string, value: number | string,
): UpdateDeploy => ({
  type: UPDATE_DEPLOY,
  id,
  property,
  value,
})

export default updateDeploy
