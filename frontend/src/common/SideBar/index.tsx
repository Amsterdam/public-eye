import React from 'react'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
  root: {
    borderRight: '0.5px solid grey',
    maxWidth: theme.spacing(52.5),
    minWidth: theme.spacing(52.5),
  },
}))

type SideBarProps = {
  children: React.ReactNode,
}

const SideBar = ({ children }: SideBarProps): React.ReactElement => {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      {children}
    </div>
  )
}

export default SideBar
