import React, { memo, useMemo } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import FastForwardIcon from '@material-ui/icons/FastForward'
import ErrorIcon from '@material-ui/icons/Error'
import DoneIcon from '@material-ui/icons/DoneAll'
import ScheduleIcon from '@material-ui/icons/Schedule'
import ListItem from '@material-ui/core/ListItem'
import Divider from '@material-ui/core/Divider'
import Typography from '@material-ui/core/Typography'
import Tooltip from '@material-ui/core/Tooltip'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import IconButton from '@material-ui/core/IconButton'
import ReloadIcon from '@material-ui/icons/Autorenew'
import CloneIcon from '@material-ui/icons/Refresh'

const useStyles = makeStyles((theme) => ({
  actions: {
    minWidth: 300,
    padding: theme.spacing(1),
    borderBottom: '1px solid',
  },
  item: {
    display: 'flex',
  },
  icon: {
    paddingRight: theme.spacing(1),
    color: 'gray',
    display: 'flex',
    alignItems: 'center',
  },
  text: {
    overflowWrap: 'anywhere',
    paddingRight: theme.spacing(4),
  },
}))

const Item = ({
  name,
  status,
  onClick,
  reload,
  clone,
  isSelected,
}: {
  name: React.ReactElement,
  status: string,
  onClick: () => null,
  reload: () => null,
  clone: () => null,
  isSelected: boolean | undefined,
}) => {
  const classes = useStyles()

  const icon = useMemo(() => {
    if (status === 'scheduled') {
      return <ScheduleIcon fontSize="small" />
    }
    if (status === 'error') {
      return <ErrorIcon fontSize="small" />
    }
    if (status === 'running') {
      return <FastForwardIcon fontSize="small" />
    }
    if (status === 'done') {
      return <DoneIcon fontSize="small" />
    }
    return ''
  }, [status])

  return (
    <>
      <ListItem
        button
        selected={Boolean(isSelected)}
        onClick={onClick}
        className={classes.item}
      >
        <div className={classes.icon}>
          {icon}
        </div>
        <div className={classes.text}>
          { name }
        </div>
        <ListItemSecondaryAction>
          {
            reload
            && (
              <Tooltip
                title="Restart"
              >
                <span>
                  <IconButton
                    disabled={status === 'running'}
                    size="small"
                    onClick={reload}
                  >
                    <ReloadIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )
          }
          {
            clone
            && (
              <Tooltip
                title="Clone"
              >
                <IconButton size="small" onClick={clone}>
                  <CloneIcon />
                </IconButton>
              </Tooltip>
            )
          }
        </ListItemSecondaryAction>
      </ListItem>
      <Divider />
    </>
  )
}

export default React.memo(Item)
