import React from 'react'
import { Box } from '@material-ui/core'
import { ReactComponent as YourSvg } from './Button - Capture - blue.svg'

const Capture = ({
  props = {},
}: {
  // eslint-disable-next-line
  props: undefined | Record<string, any>
}): JSX.Element => (
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
