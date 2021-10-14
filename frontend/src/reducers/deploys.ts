import { prepend } from 'ramda'
import { Deploy } from 'types'
import { SET_DEPLOYS, SetDeploys } from 'actions/deploys/setDeploys'
import { SET_DEPLOY, SetDeploy } from 'actions/deploys/setDeploy'
import { ADD_DEPLOY, AddDeploy } from 'actions/deploys/addDeploy'
import { UPDATE_DEPLOY, UpdateDeploy } from 'actions/deploys/updateDeploy'
import { DELETE_DEPLOY, DeleteDeploy } from 'actions/deploys/deleteDeploy'
import { SET_OR_ADD_CACHED_DEPLOY, SetOrAddCachedDeploy } from 'actions/deploys/setOrAddCachedDeploy'
import { RESET_STATE, ResetStateAction } from 'actions/general/resetState'

type DeploysReducer = {
  deploys: Map<number, Deploy>,
  deployCache: Record<number, Deploy>,
}

type ReducerAction = (
  SetDeploys
  | AddDeploy
  | SetDeploy
  | ResetStateAction
  | UpdateDeploy
  | DeleteDeploy
)

const defaultState = {
  deploys: new Map<number, Deploy>(),
  deployCache: {},
}

const setDeploys = (
  state: DeploysReducer, action: SetDeploys,
): DeploysReducer => {
  const newDeploys = new Map<number, Deploy>()

  action.deploys.forEach((deploy: Deploy) => {
    newDeploys.set(deploy.id, deploy)
  })

  return {
    ...state,
    deploys: newDeploys,
  }
}

const setDeploy = (
  state: DeploysReducer, action: SetDeploy,
): DeploysReducer => ({
  ...state,
  deploys: new Map(state.deploys.set(action.deploy.id, action.deploy)),
})

const addDeploy = (
  state: DeploysReducer, action: AddDeploy,
) => ({
  ...state,
  deploys: new Map(prepend([action.deploy.id, action.deploy])(Array.from(state.deploys.entries()))),
})

const updateDeploy = (
  state: DeploysReducer, action: UpdateDeploy,
): DeploysReducer => {
  const deploy = state.deploys.get(action.id)

  if (!deploy) {
    return state
  }

  return {
    deployCache: state.deployCache[action.id]
      ? ({
        ...state.deployCache,
        [action.id]: {
          ...state.deployCache[action.id],
          [action.property]: action.value,
        },
      }) : state.deployCache,
    deploys: new Map(
      state.deploys.set(
        action.id,
        {
          ...deploy,
          [action.property]: action.value,
        },
      ),
    ),

  }
}

const deleteDeploy = (
  state: DeploysReducer,
  action: DeleteDeploy,
) => {
  state.deploys.delete(action.id)

  return {
    ...state,
    deploys: new Map(state.deploys),
  }
}

const setOrAddCachedDeploy = (
  state: DeploysReducer,
  action: SetOrAddCachedDeploy,
) => ({
  ...state,
  deployCache: {
    ...state.deployCache,
    [action.deploy.id]: action.deploy,
  },
})

const reducer = (
  state: DeploysReducer = defaultState,
  action: ReducerAction,
): DeploysReducer => {
  switch (action.type) {
    case RESET_STATE:
      return defaultState
    case DELETE_DEPLOY:
      return deleteDeploy(state, action as DeleteDeploy)
    case SET_DEPLOYS:
      return setDeploys(state, action as SetDeploys)
    case SET_DEPLOY:
      return setDeploy(state, action as SetDeploy)
    case ADD_DEPLOY:
      return addDeploy(state, action as AddDeploy)
    case UPDATE_DEPLOY:
      return updateDeploy(state, action as UpdateDeploy)
    case SET_OR_ADD_CACHED_DEPLOY:
      return setOrAddCachedDeploy(state, action as SetOrAddCachedDeploy)
    default:
      return state
  }
}

export default reducer
