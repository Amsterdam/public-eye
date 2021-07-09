import React, {
  memo, useCallback, useEffect, useState,
} from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'

const useStyles = makeStyles({
  header: {
    display: 'flex',
    borderBottom: '0.5px solid grey',
    justifyContent: 'center',
  },
})

const locationToTab = (location: string): number => {
  const strippedLocation = location.split('/')[2]

  switch (strippedLocation) {
    case 'videos':
      return 0
    case 'collections':
      return 1
    case 'datasets':
      return 2
    default:
      return 0
  }
}

const tabToLocation = (location: number): string => {
  switch (location) {
    case 0:
      return '/videos'
    case 1:
      return '/collections'
    case 2:
      return '/datasets'
    default:
      return '/videos'
  }
}

const useLocationToTab = (location: string): number => {
  const [tabSelected, setTabSelected] = useState(0)

  useEffect(() => {
    setTabSelected(locationToTab(location))
  }, [location])

  return tabSelected
}

const NavigatorHeader = () => {
  const classes = useStyles()
  const location = useLocation()
  const history = useHistory()
  const tabSelected = useLocationToTab(location.pathname)

  const changeTab = useCallback((e, index) => {
    const newLocation = tabToLocation(index)
    history.push(`/ingest${newLocation}`)
  }, [history])

  return (
    <div className={classes.header}>
      <Paper square>
        <Tabs
          value={tabSelected}
          indicatorColor="primary"
          textColor="primary"
          onChange={changeTab}
          aria-label="disabled tabs example"
          style={{
            transitionDuration: '0s !important',
          }}
        >
          <Tab
            disableRipple
            label="Videos"
            style={{
              transitionDuration: '0s !important',
            }}
          />
          <Tab
            disableRipple
            label="Collections"
            style={{
              transitionDuration: '0s !important',
            }}
          />
          <Tab
            disableRipple
            label="Datasets"
            style={{
              transitionDuration: '0s !important',
            }}
          />
        </Tabs>
      </Paper>
    </div>
  )
}

export default memo(NavigatorHeader)
