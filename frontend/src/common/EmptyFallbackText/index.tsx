import React from 'react'
import {
  Box,
  Typography,
} from '@material-ui/core'

const EmptyFallbackText = ({
  children,
  isEmpty,
  fallbackText,
}: {
  children: React.ReactElement,
  fallbackText: string,
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
      >
        <Typography>
          {fallbackText}
        </Typography>
      </Box>
    )
  }

  return children
}

export default EmptyFallbackText
