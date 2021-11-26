// @ts-nocheck
import React, { useState, useCallback } from 'react'
import * as R from 'ramda'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import RenameIcon from '@material-ui/icons/Create'
import FinishedIcon from '@material-ui/icons/Check'
import AddIcon from '@material-ui/icons/Add'
import DeleteIcon from '@material-ui/icons/Delete'
import RenameDialog from 'common/RenameDialog'
import AddToCollectionDialog from 'common/AddToCollectionDialog'
import updateFrame from 'thunks/frames/updateFrame'
import deleteFrame from 'thunks/frames/deleteFrame'
import { Frame } from 'types'

const useStyles = makeStyles((theme) => ({
  speedDial: {
    position: 'absolute',
    '&.MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
    '&.MuiSpeedDial-directionDown, &.MuiSpeedDial-directionRight': {
      top: theme.spacing(2),
      left: theme.spacing(2),
    },
  },
}));

type SpeedDialsProps = {
  frame: Frame,
}

const SpeedDials = (props: SpeedDialsProps): React.ReactElement => {
  const {
    frame,
  } = props

  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [open, setOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [addToCollectionDialogOpen, setAddToCollectionDialogOpen] = useState(false)

  const setLock = useCallback(
    (value) => () => {
      dispatch(updateFrame(
        frame.id,
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          locked: value,
          path: frame.path,
        },
        frame.item_id || frame.video_file_id,
        frame.type as string,
        value ? (x) => Number(x) + 1 : (x) => Number(x) - 1,
      ))
    }, [dispatch, frame.id, frame.item_id, frame.video_file_id, frame.type, frame.path],
  )

  const commitDelete = useCallback(() => {
    dispatch(deleteFrame(frame.id, frame.item_id || frame.video_file_id, frame.type))
  }, [frame.id, frame.item_id, frame.type, frame.video_file_id, dispatch])

  const actions = [
    { icon: <RenameIcon />, name: 'Rename', func: () => setRenameDialogOpen(true) },
    { icon: <FinishedIcon />, name: frame.locked ? 'Set to unfinished' : 'Set to finished', func: setLock(!frame.locked) },
    { icon: <AddIcon />, name: 'Add to collection', func: () => setAddToCollectionDialogOpen(true) },
    {
      icon: <DeleteIcon />, name: 'Delete', func: commitDelete, disabled: frame.locked,
    },
  ]

  const handleClose = () => {
    setOpen(false)
  }

  const handleOpen = () => {
    setOpen(true)
  }

  const renameFunction = (value) => {
    const newPath = R.pipe(
      R.split('/'),
      // replace filename with file from request
      R.update(-1, value),
      R.join('/'),
    )(frame.path)

    dispatch(updateFrame(
      frame.id,
      {
        locked: frame.locked,
        path: newPath,
      },
      frame.item_id || frame.video_file_id,
      frame.type,
    ))
  }

  return (
    <div>
      <div>
        <SpeedDial
          ariaLabel="SpeedDial example"
          className={classes.speedDial}
          icon={<SpeedDialIcon />}
          onClose={handleClose}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          open={open}
          style={{
            position: 'absolute',
            right: 20,
            bottom: 20,
          }}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              disabled={action.disabled === true}
              onClick={() => {
                action.func()
                handleClose()
              }}
            />
          ))}
        </SpeedDial>
      </div>
      <RenameDialog
        open={renameDialogOpen}
        handleClose={() => {
          setRenameDialogOpen(false)
          handleClose()
        }}
        title="Rename frame"
        renameFunction={renameFunction}
      />
      <AddToCollectionDialog
        open={addToCollectionDialogOpen}
        handleClose={() => setAddToCollectionDialogOpen(false)}
        selectedFrameIds={[frame.id]}
        button={false}
      />
    </div>
  )
}

export default SpeedDials
