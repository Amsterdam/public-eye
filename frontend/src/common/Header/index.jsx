import React, { memo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import UserMenu from './UserMenu'
import NavigationMenu from './NavigationMenu'

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  icon: {
    paddingRight: theme.spacing(1),
  },
  title: {
    fontWeight: 500,
    flexGrow: 1,
    letterSpacing: 12,
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.7rem',
  },
  header: {
    backgroundColor: '#243799',
  },
}))

const Header = () => {
  const classes = useStyles()
  const location = useLocation()

  return (
    <div className={classes.root}>
      <AppBar className={classes.header} position="fixed">
        <Toolbar>
          <Typography className={classes.title} variant="h5">
            EAGLE EYE
          </Typography>
          {
            // show links if the user is logged in
            location.pathname !== '/login'
            && (
              <>
                <NavigationMenu
                  menuItems={[
                    'home',
                    'ingest',
                    'train',
                    'jobs',
                    'camera',
                    'deploy',
                    'users',
                  ]}
                />
                <UserMenu />
              </>
            )
          }
        </Toolbar>
      </AppBar>
    </div>
  )
}

export default memo(Header)
