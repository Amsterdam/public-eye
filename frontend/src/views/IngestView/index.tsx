import React from 'react'
import { Route } from 'react-router-dom'
import Videos from './Videos'
import Collections from './Collections'
import Datasets from './Datasets'

const IngestView = ({
  match,
}: {
  match: {
    url: string,
  },
}): JSX.Element => (
  <div>
    <Route
      path={[
        `${match.url}/videos/:id?`,
        `${match.url}/videos/:id/frames/:frameId?`,
      ]}
      exact
      component={Videos}
    />
    <Route
      path={[
        `${match.url}/collections/:id?`,
        `${match.url}/collections/:id/frames/:frameId?`,
      ]}
      exact
      component={Collections}
    />
    <Route
      path={`${match.url}/datasets/:id?`}
      exact
      component={Datasets}
    />
    <Route
      path={`${match.url}`}
      exact
      component={Videos}
    />
  </div>
)

export default IngestView
