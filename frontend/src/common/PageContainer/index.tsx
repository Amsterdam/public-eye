import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Box } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    paddingTop: theme.spacing(8),
    height: `calc(100vh - ${theme.spacing(8)}px)`,
  },
}))

type PageContainerProps = {
  children: React.ReactNode,
}

const PageContainer = ({ children }: PageContainerProps): React.ReactElement => {
  const classes = useStyles()

  return (
    <Box
      display="flex"
      className={classes.root}
    >
      {children}
    </Box>
  )
}

export default PageContainer
