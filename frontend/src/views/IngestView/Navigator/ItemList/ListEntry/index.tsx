import React, { memo, useMemo } from 'react'
import { useRouteMatch } from 'react-router-dom'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core/styles'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import CheckIcon from '@material-ui/icons/CheckCircle'
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'
import green from '@material-ui/core/colors/green'
import { Collection, Video } from 'types'

const useStyles = makeStyles((theme) => ({
  actions: {
    display: 'flex',
  },
  listItem: {
    height: theme.spacing(6),
    display: 'flex',
  },
}))

type ListEntryProps = {
  type: string,
  entry: Collection | Video,
  itemIndex: number,
  onItemClick: () => void,
  onDoubleClick: () => void,
}

const ListEntry = (props: ListEntryProps) => {
  const {
    type,
    entry,
    itemIndex,
    onItemClick,
    onDoubleClick,
  } = props
  const classes = useStyles()
  const match = useRouteMatch(['/ingest/collections/:id', '/ingest/videos/:id'])

  const name: string = useMemo(() => (
    type === 'video'
      ? (
        R.pipe(
          R.path(['path']),
          R.split('/'),
          R.last,
        )(entry)
      )
      : (entry as Collection).name
  ), [entry, type])

  const isSelected = useMemo(() => {
    if (!match) {
      return false
    }
    const id = Number(match.params.id)

    return id === entry.id
  }, [match, entry])

  return (
    <div key={itemIndex}>
      <ListItem
        className={classes.listItem}
        onClick={onItemClick(entry)}
        onDoubleClick={onDoubleClick(entry)}
        button
        selected={isSelected}
      >
        <ListItemIcon>
          <CheckIcon
            style={{
              color: entry.frame_locked_count === entry.frame_count && Number(entry.frame_count) > 0
                ? green[600]
                : green[100],
            }}
          />
        </ListItemIcon>
        <Typography variant="body2">
          { `${name} (${entry.frame_locked_count || 0}/${entry.frame_count || 0})`}
        </Typography>
      </ListItem>
      <Divider />
    </div>
  )
}

const areEqual = (prevProps: ListEntryProps, nextProps: ListEntryProps) => {
  if (!R.equals(prevProps.type, nextProps.type)) {
    return false
  }
  if (!R.equals(prevProps.entry, nextProps.entry)) {
    return false
  }
  if (!R.equals(prevProps.itemIndex, nextProps.itemIndex)) {
    return false
  }
  if (!R.equals(prevProps.onItemClick, nextProps.onItemClick)) {
    return false
  }
  return true
}

export default memo(ListEntry, areEqual)
