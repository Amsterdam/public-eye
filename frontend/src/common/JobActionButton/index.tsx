import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Fab from '@material-ui/core/Fab'
import CancelIcon from '@material-ui/icons/CancelOutlined'
import AlertDialog from 'common/AlertDialog'

const useStyles = makeStyles(() => ({
  button: {
    position: 'absolute',
    bottom: ({ bottom }: { right: number, bottom: number }) => bottom,
    right: ({ right }: { right: number, bottom: number }) => right,
  },
}))

const JobActionButton = ({
  fabAction,
  fabTitle,
  disabled,
  dialogTitle,
  bottom = 30,
  right = 30,
}: {
  fabAction: () => void,
  fabTitle: string,
  disabled: boolean,
  dialogTitle: string,
  bottom: number | undefined,
  right: number | undefined,
}): JSX.Element => {
  const classes = useStyles({ bottom, right })
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)

  return (
    <>
      <Fab
        onClick={() => setAlertDialogOpen(true)}
        variant="extended"
        className={classes.button}
        color="secondary"
        disabled={disabled}
      >
        <CancelIcon />
        { fabTitle }
      </Fab>
      <AlertDialog
        open={alertDialogOpen}
        handleClose={() => setAlertDialogOpen(false)}
        submitFunction={fabAction}
        title={dialogTitle}
      />
    </>
  )
}

export default JobActionButton
