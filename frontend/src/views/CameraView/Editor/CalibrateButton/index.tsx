import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import CalibrateIcon from '@material-ui/icons/BlurOn'
import Fab from '@material-ui/core/Fab'
import { useSelectedId } from 'utils'
import CalibrateDialog from './CalibrateDialog'
import { NAVIGATOR_WIDTH } from '../../Navigator'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  button: {
    margin: theme.spacing(1),
  },
  fabButton: {
    position: 'absolute',
    left: NAVIGATOR_WIDTH + 20,
    bottom: 20,
    fontSize: '0.6rem',
    zIndex: 1000,
  },
  icon: {
    marginRight: theme.spacing(1),
  },
}))

const CalibrateButton = (): JSX.Element => {
  const cameraId = useSelectedId(['/camera/:id'])
  const classes = useStyles()
  const [calibrateDialogOpen, setCalibrateDialogOpen] = useState(false)

  return (
    <>
      <CalibrateDialog
        open={calibrateDialogOpen}
        handleClose={() => setCalibrateDialogOpen(false)}
        cameraId={Number(cameraId)}
      />
      <Fab
        size="small"
        color="primary"
        variant="extended"
        className={classes.fabButton}
        onClick={() => setCalibrateDialogOpen(true)}
        disabled={!cameraId}
      >
        <CalibrateIcon className={classes.icon} />
        calibrate
      </Fab>
    </>
  )
}

export default CalibrateButton
