import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import AddIcon from '@material-ui/icons/Add'
import NewCameraDialog from './NewCameraDialog'

const useStyles = makeStyles((theme) => ({
  root: {
    height: 64,
    borderBottom: '1px solid',
    display: 'flex',
    alignItems: 'center',
  },
  button: {
    margin: theme.spacing(1),
  },
}))

const NavigatorHeader = (): JSX.Element => {
  const classes = useStyles()
  const [newCameraDialogOpen, setNewCameraDialogOpen] = useState(false)

  return (
    <>
      <div className={classes.root}>
        <Button
          color="primary"
          variant="contained"
          className={classes.button}
          onClick={() => setNewCameraDialogOpen(true)}
        >
          <AddIcon />
          camera
        </Button>
      </div>
      <NewCameraDialog
        open={newCameraDialogOpen}
        // @ts-ignore
        handleClose={() => setNewCameraDialogOpen(false)}
      />
    </>
  )
}

export default NavigatorHeader
