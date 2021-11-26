// @ts-nocheck
import React, { useMemo, useCallback, memo } from 'react'
import * as R from 'ramda'
import { useHistory } from 'react-router-dom'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import green from '@material-ui/core/colors/green'
import ListItem from '@material-ui/core/ListItem'
import Typography from '@material-ui/core/Typography'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import Checkbox from '@material-ui/core/Checkbox'
import CheckIcon from '@material-ui/icons/CheckCircle'
import IconButton from '@material-ui/core/IconButton'
import updateFrame from 'thunks/frames/updateFrame'
import { usePage, useIngestPath } from 'utils'
import { Frame } from 'types'
import { useTitle } from './utils'

const useStyles = makeStyles({
  entry: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    overflowWrap: 'anywhere',
  },
})

type FrameEntryProps = {
  frame: Frame,
  index: number,
  checked: boolean,
  locked: boolean,
  itemId: number,
  itemType: string,
  setCheckedItems: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
}

const FrameEntry = ({
  frame,
  index,
  checked,
  locked,
  itemId,
  itemType,
  setCheckedItems,
}: FrameEntryProps) => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const history = useHistory()
  const page = usePage()
  const {
    frameId: selectedFrameId,
    id,
    type,
  } = useIngestPath()
  const title = useTitle(frame)

  const selected = frame.id === Number(selectedFrameId)

  const onFrameClick = useCallback(() => {
    history.push(`/ingest/${String(type)}/${String(id)}/frames/${String(frame.id)}?page=${page}`)
  }, [frame.id, history, id, type, page])

  const handleCheck = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckedItems((ci) => ({ ...ci, [frame.id]: event.target.checked }))
  }, [setCheckedItems, frame.id])

  const setLock = useCallback(
    (value) => (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault()
      e.stopPropagation()
      dispatch(updateFrame(frame.id,
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          locked: value,
          path: frame.path,
        },
        itemId,
        itemType,
        value ? (x) => Number(x) + 1 : (x) => Number(x) - 1))
    }, [dispatch, frame.id, itemId, itemType, frame.path],
  )

  const lockIcon = useMemo(() => {
    if (locked) {
      return (
        <IconButton onClick={setLock(false)} size="small">
          <CheckIcon style={{ color: green[600] }} fontSize="small" />
        </IconButton>
      )
    }
    return (
      <IconButton onClick={setLock(true)} size="small">
        <CheckIcon style={{ color: green[100] }} fontSize="small" />
      </IconButton>
    )
  }, [locked, setLock])

  return (
    <ListItem
      onClick={onFrameClick}
      key={index}
      data-testid="frame-entry"
      button
      selected={selected}
      className={classes.entry}
      // href={`/ingest/${String(type)}/${String(id)}/frames/${String(frame.id)}`}
    >
      <ListItemIcon>
        { lockIcon }
      </ListItemIcon>
      <Typography className={classes.title} variant="body2">
        { title }
      </Typography>
      <ListItemSecondaryAction>
        <Checkbox
          disabled={!frame.locked}
          checked={checked}
          onChange={handleCheck}
          size="small"
        />
      </ListItemSecondaryAction>
    </ListItem>
  )
}

const areEqual = (prevProps: FrameEntryProps, nextProps: FrameEntryProps) => {
  if (!R.equals(prevProps.title, nextProps.title)) {
    return false
  }
  if (!R.equals(prevProps.selectedFrameId, nextProps.selectedFrameId)) {
    if (prevProps.selectedFrameId === prevProps.frame.id) {
      return false
    }
    if (nextProps.selectedFrameId === nextProps.frame.id) {
      return false
    }
  }
  if (!R.equals(prevProps.index, nextProps.index)) {
    return false
  }
  if (!R.equals(prevProps.frame, nextProps.frame)) {
    return false
  }
  if (!R.equals(prevProps.checked, nextProps.checked)) {
    return false
  }
  if (!R.equals(prevProps.locked, nextProps.locked)) {
    return false
  }
  if (!R.equals(prevProps.itemId, nextProps.itemId)) {
    return false
  }
  if (!R.equals(prevProps.itemType, nextProps.itemType)) {
    return false
  }
  if (!R.equals(prevProps.setCheckedItems, prevProps.setCheckedItems)) {
    return false
  }
  return true
}

export default memo(FrameEntry, areEqual)
