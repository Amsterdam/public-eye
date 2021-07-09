import React, {
  useMemo, useCallback,
} from 'react'
import {
  pipe,
  reverse,
} from 'ramda'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core'
import CameraIcon from '@material-ui/icons/PhotoCamera'
import Divider from '@material-ui/core/Divider'
import SideBar from 'common/SideBar'
import { useSelectedId } from 'utils'
import { RootState } from 'reducers'
import { Camera } from 'types'
import NavigatorHeader from './NavigatorHeader'

export const NAVIGATOR_WIDTH = 420

const useStyles = makeStyles((theme) => ({
  text: {
    overflowWrap: 'anywhere',
    paddingRight: theme.spacing(4),
  },
  icon: {
    paddingRight: theme.spacing(1),
    color: 'gray',
    display: 'flex',
    alignItems: 'center',
  },
  item: {
    display: 'flex',
  },
  list: {
    overflowY: 'auto',
    height: `calc(100vh - ${theme.spacing(18.2)}px)`,
    minWidth: NAVIGATOR_WIDTH,
  },
}))

const Navigator = (): React.ReactElement => {
  const selectedId = useSelectedId()
  const classes = useStyles()
  const history = useHistory()
  const cameras = useSelector((state: RootState) => state.cameras)

  const items: Camera[] = useMemo(() => pipe(
    (tempCameras: Map<number, Camera>) => Array.from(tempCameras.values()),
    reverse,
  )(cameras), [cameras])

  const navigate = useCallback((id: number) => {
    history.push(`/camera/${id}`)
  }, [history])

  const handleItem = useCallback((item: Camera) => (
    <div key={item.id}>
      <ListItem
        button
        className={classes.item}
        selected={Number(selectedId) === item.id}
        onClick={() => navigate(item.id)}
      >
        <div className={classes.icon}>
          <CameraIcon />
        </div>
        <Typography className={classes.text}>
          {item.name || 'Unnamed'}
        </Typography>
      </ListItem>
      <Divider />
    </div>
  ), [classes.icon, classes.item, classes.text, selectedId, navigate])

  return (
    <SideBar>
      <NavigatorHeader />
      <List className={classes.list}>
        {
          items.map(handleItem)
        }
      </List>
    </SideBar>

  )
}

export default Navigator
