import React from 'react'
import { useSelector } from 'react-redux'
import { length, intersection } from 'ramda'
import { useHistory } from 'react-router-dom'
import { Button } from '@material-ui/core'
import { RootState } from 'reducers'

export const showView = (userRoles: string[]) => (view: string): boolean => {
  const viewToRole: Record<string, string[]> = {
    ingest: ['tagger', 'admin'],
    train: ['trainer', 'admin'],
    jobs: ['trainer', 'deployer', 'tagger', 'admin'],
    camera: ['deployer', 'admin'],
    deploy: ['deployer', 'admin'],
    users: ['admin'],
    home: ['trainer', 'deployer', 'tagger', 'admin'],
  }

  const viewRoles = viewToRole[view]
  if (viewRoles) {
    const overlappingRoles = intersection(userRoles, viewRoles)

    // user has at least one of the roles that are authorized
    return length(overlappingRoles) > 0
  }
  return false
}

type NavigationMenuProps = {
  menuItems: string[],
}

const NavigationMenu = (props: NavigationMenuProps) => {
  const {
    menuItems,
  } = props

  const history = useHistory()
  const userRoles = useSelector((state: RootState) => state.general.userAuth.roles)
  const navigate = React.useCallback((label: string) => () => history.push(`/${label}`), [history])

  const filteredMenuItems = React.useMemo(
    () => menuItems.filter(showView(userRoles)), [menuItems, userRoles],
  )

  return filteredMenuItems.map((name) => (
    <Button
      onClick={navigate(name)}
      color="inherit"
      key={name}
    >
      {name}
    </Button>
  ))
}

export default NavigationMenu
