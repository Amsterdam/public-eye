import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Box } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  root: {
    height: 'inherit',
    overflowY: 'auto',
    backgroundColor: '#f6f8fa',
  },
}))

type ContentContainerProps = {
  children: React.ReactNode,
}

const ContentContainer = ({ children }: ContentContainerProps): React.ReactElement => {
  const classes = useStyles()

  return (
    <Box
      flexDirection="row"
      className={classes.root}
      flexGrow={1}
      display="flex"
      flexWrap="wrap"
    >
      {children}
    </Box>
  )
}

export default ContentContainer
