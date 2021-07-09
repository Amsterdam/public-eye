import { prepend } from 'ramda'
import { Deploy } from 'types'
import { SET_DEPLOYS, SetDeploys } from 'actions/deploys/setDeploys'
import { SET_DEPLOY, SetDeploy } from 'actions/deploys/setDeploy'
import { ADD_DEPLOY, AddDeploy } from 'actions/deploys/addDeploy'
import { UPDATE_DEPLOY, UpdateDeploy } from 'actions/deploys/updateDeploy'
import { DELETE_DEPLOY, DeleteDeploy } from 'actions/deploys/deleteDeploy'
import { RESET_STATE, ResetStateAction } from 'actions/general/resetState'

type DeploysReducer = Map<number, Deploy>

type ReducerAction = (
  SetDeploys
  | AddDeploy
  | SetDeploy
  | ResetStateAction
  | UpdateDeploy
  | DeleteDeploy
)

const defaultState = new Map<number, Deploy>()

const setDeploys = (
  state: DeploysReducer, action: SetDeploys,
): DeploysReducer => {
  const newDeploys = new Map<number, Deploy>()

  action.deploys.forEach((deploy: Deploy) => {
    newDeploys.set(deploy.id, deploy)
  })

  return newDeploys
}

const setDeploy = (
  state: DeploysReducer, action: SetDeploy,
): DeploysReducer => (
  new Map(state.set(action.deploy.id, action.deploy))
)

const addDeploy = (
  state: DeploysReducer, action: AddDeploy,
) => (
  new Map(prepend([action.deploy.id, action.deploy])(Array.from(state.entries())))
)

const updateDeploy = (
  state: DeploysReducer, action: UpdateDeploy,
): DeploysReducer => {
  const deploy = state.get(action.id)

  if (!deploy) {
    return state
  }

  return new Map(
    state.set(
      action.id,
      {
        ...deploy,
        [action.property]: action.value,
      },
    ),
  )
}

const deleteDeploy = (
  state: DeploysReducer,
  action: DeleteDeploy,
) => {
  state.delete(action.id)

  return new Map(state)
}

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
    default:
      return state
  }
}

export default reducer
