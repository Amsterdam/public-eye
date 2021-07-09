import React from 'react'
import {
  Box,
  Typography,
} from '@material-ui/core'

const EmptyFallbackElement = ({
  children,
  isEmpty,
  fallbackElement,
}: {
  children: React.ReactElement,
  fallbackElement: React.ReactElement,
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
        flexWrap="wrap"
      >
        {fallbackElement}
      </Box>
    )
  }

  return children
}

export default EmptyFallbackElement
