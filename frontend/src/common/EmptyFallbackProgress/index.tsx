import React from 'react'
import {
  Box,
  CircularProgress,
} from '@material-ui/core'

const EmptyFallbackProgress = ({
  children,
  isEmpty,
}: {
  children: React.ReactElement,
  isEmpty: boolean,
}): React.ReactElement => {
  if (isEmpty) {
    return (
      <Box
        height="100%"
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        padding={4}
      >
        <CircularProgress />
      </Box>
    )
  }

  return children
}

export default EmptyFallbackProgress
