import React from 'react'
// import svg from './Button - Capture - blue.svg'
import { Box } from '@material-ui/core'
import { ReactComponent as YourSvg } from './Button - MultiStream - blue.svg'

const Capture = ({
  props = {},
}: {
  props: undefined | Record<string, any>
}) => (
  <Box paddingRight={1} paddingLeft={1} display="flex">
    <YourSvg
      {...props}
      height={20}
      width={20}
      fill="grey"
      stroke="grey"
      color="red"
      style={{
        color: 'red',
      }}
    />
  </Box>
)

export default Capture
