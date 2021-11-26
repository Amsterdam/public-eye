import { Deploy } from 'types'

export const SET_DEPLOY = 'SET_DEPLOY'

export type SetDeploy = {
  type: string,
  deploy: Deploy,
}

const setDeploy = (deploy: Deploy): SetDeploy => ({
  type: SET_DEPLOY,
  deploy,
})

export default setDeploy
