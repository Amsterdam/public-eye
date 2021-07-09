import { Deploy } from 'types'

export const ADD_DEPLOY = 'ADD_DEPLOY'

export type AddDeploy = {
  type: string,
  deploy: Deploy,
}

const addDeploy = (deploy: Deploy) => ({
  type: ADD_DEPLOY,
  deploy,
})

export default addDeploy
