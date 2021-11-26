import React, { useEffect } from 'react'
import DateFnsUtils from '@date-io/date-fns'
import { Provider, useDispatch } from 'react-redux'
import { MuiPickersUtilsProvider } from '@material-ui/pickers'
import { MuiThemeProvider } from '@material-ui/core/styles'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { PrivateRoute, getToken } from 'utils'
import getUserRoles from 'thunks/auth/getUserRoles'
import WebsocketHandler from 'common/WebsocketHandler'
import theme from './theme'
import store from './store'
import IngestView from './views/IngestView'
import TrainView from './views/TrainView'
import LoginView from './views/LoginView'
import DeployView from './views/DeployView'
import CameraView from './views/CameraView'
import JobsView from './views/JobsView'
import UsersView from './views/UsersView'
import HomeView from './views/HomeView'
import Info from './common/Info'
import Header from './common/Header'

const Utilization = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const token = getToken()
    if (token) {
      dispatch(getUserRoles(token))
    }
  }, [dispatch])

  return <></>
}

const App = (): JSX.Element => (
  <MuiPickersUtilsProvider utils={DateFnsUtils}>
    <div className="App">
      <Router>
        <Provider store={store}>
          <WebsocketHandler>
            <MuiThemeProvider theme={theme}>
              <Utilization />
              <Header />
              <PrivateRoute
                path="/"
                exact
                component={HomeView}
              />
              <PrivateRoute
                path="/home"
                exact
                component={HomeView}
              />
              <PrivateRoute
                path="/camera/:id?"
                exact
                component={CameraView}
              />
              <PrivateRoute
                path="/ingest"
                component={IngestView}
              />
              <PrivateRoute
                path="/deploy/:id?"
                exact
                component={DeployView}
              />
              <PrivateRoute
                path="/train"
                component={TrainView}
              />
              <PrivateRoute
                path="/jobs/:id?"
                exact
                component={JobsView}
              />
              <Route
                path="/login"
                exact
                component={LoginView}
              />
              <Route
                path="/users"
                exact
                component={UsersView}
              />
              <Info />
            </MuiThemeProvider>
          </WebsocketHandler>
        </Provider>
      </Router>
    </div>
  </MuiPickersUtilsProvider>
)

export default App
