import { Deploy } from 'types'

export const SET_OR_ADD_CACHED_DEPLOY = 'SET_OR_ADD_CACHED_DEPLOY'

export type SetOrAddCachedDeploy = {
  type: string,
  deploy: Deploy,
}

const setOrAddCachedDeploy = (deploy: Deploy): SetOrAddCachedDeploy => ({
  type: SET_OR_ADD_CACHED_DEPLOY,
  deploy,
})

export default setOrAddCachedDeploy
