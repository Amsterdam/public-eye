import thunk, { ThunkAction, ThunkDispatch } from 'redux-thunk'
import { useDispatch } from 'react-redux'
import { createStore, applyMiddleware, Action } from 'redux'
import rootReducer, { RootState } from '../reducers'

const store = createStore(
  rootReducer,
  {},
  applyMiddleware(thunk),
)

export type AppThunk<ReturnType = void> = (
  ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
  >
)

export type AppThunkDispatch = ThunkDispatch<RootState, unknown, Action<string>>
export type AppDispatch = typeof store.dispatch
// eslint-disable-next-line
export const useThunkDispatch = () => useDispatch<AppThunkDispatch>()
export default store
