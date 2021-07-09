import React from 'react'
import {
  makeStyles,
} from '@material-ui/core'
import { StoreContext } from './context'

const useStyles = makeStyles(() => ({
  root: {
    position: 'absolute',
    border: '1px solid #2affcdf2',
    width: (props: { zoomSize: number }) => props.zoomSize,
    height: (props: { zoomSize: number }) => props.zoomSize,
    zIndex: 100,
  },
}))

const ZoomLens = () => {
  const {
    zoomSize: [zoomSize],
    zoomLocation: [zoomLocation],
    renderedImageSize: [{
      top, width, height, left,
    }],
  } = React.useContext(StoreContext)
  const classes = useStyles({ zoomSize })

  return zoomLocation
    ? (
      <div
        className={classes.root}
        style={{
          top: (zoomLocation[1] * height) + top,
          left: (zoomLocation[0] * width) + left,
        }}
      />
    ) : <div />
}

export default React.memo(ZoomLens)
