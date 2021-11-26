import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import {
  Tabs,
  Tab,
  Box,
} from '@material-ui/core'

const locationToTab = (location: string): number => {
  const strippedLocation = location.split('/')[2]

  switch (strippedLocation) {
    case 'runs':
      return 0
    case 'models':
      return 1
    default:
      return 0
  }
}

const tabToLocation = (location: number): string => {
  switch (location) {
    case 0:
      return '/runs'
    case 1:
      return '/models'
    default:
      return '/run'
  }
}

const useLocationToTab = (): number => {
  const location = useLocation()
  const [tabSelected, setTabSelected] = React.useState(0)

  React.useEffect(() => {
    setTabSelected(locationToTab(location.pathname))
  }, [location.pathname])

  return tabSelected
}

const NavigationTabs = (): JSX.Element => {
  const history = useHistory()
  const viewMode = useLocationToTab()

  const handleTabChange = React.useCallback((event, newValue) => {
    history.push(`/train${tabToLocation(newValue)}`)
  }, [history])

  return (
    <Box
      display="flex"
      width="100%"
      justifyContent="center"
      borderBottom="1px solid"
    >
      <Tabs
        value={viewMode}
        onChange={handleTabChange}
      >
        <Tab
          color="primary"
          label="training"
        />
        <Tab
          color="primary"
          label="models"
        />
      </Tabs>
    </Box>
  )
}

export default NavigationTabs
