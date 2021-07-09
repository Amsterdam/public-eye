import { Deploy } from 'types'

export const SET_DEPLOYS = 'SET_DEPLOYS'

export type SetDeploys = {
  type: string,
  deploys: Deploy[],
}

const setDeploys = (deploys: Deploy[]) => ({
  type: SET_DEPLOYS,
  deploys,
})

export default setDeploys
