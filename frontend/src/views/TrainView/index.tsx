import React from 'react'
import { Route } from 'react-router-dom'
import Runs from './Runs'
import Models from './Models'

const TrainView = ({
  match,
}: {
  match: {
    url: string,
  },
}): JSX.Element => (
  <div>
    <Route
      path={`${match.url}/runs/:id?`}
      exact
      component={Runs}
    />
    <Route
      path={`${match.url}/models/:id?`}
      exact
      component={Models}
    />
    <Route
      path={`${match.url}`}
      exact
      component={Runs}
    />
  </div>
)

export default TrainView
