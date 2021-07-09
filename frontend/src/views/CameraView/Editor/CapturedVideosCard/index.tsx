import React, { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  Card,
  CardHeader,
  CardContent,
  makeStyles,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core'
import { useThunkDispatch } from 'store'
import { getFileName, useSelectedId } from 'utils'
import { Video } from 'types'
import getVideosByCameraId from 'thunks/cameras/getVideosByCameraId'

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(2),
    width: 300,
  },
}))

const useVideosByCameraId = (cameraId: string | null): Video[] => {
  const dispatch = useThunkDispatch()
  const [videos, setVideos] = useState<Video[]>([])

  useEffect(() => {
    if (cameraId === null) {
      return
    }

    dispatch(getVideosByCameraId(cameraId))
      .then((newVideos) => {
        if (newVideos) {
          setVideos(newVideos)
        }
      })
  }, [cameraId, dispatch])

  return videos
}

const CapturedVideoCard = (): React.ReactElement => {
  const selectedCameraId = useSelectedId()
  const classes = useStyles()
  const history = useHistory()

  const videos = useVideosByCameraId(selectedCameraId)

  const navigate = useCallback((id: number) => () => {
    history.push(`/ingest/videos/${id}`)
  }, [history])

  return (
    <Card className={classes.root}>
      <CardHeader title="Captured videos" />
      <CardContent>
        <List>
          {
            videos.map(({ id, path }) => (
              <ListItem
                key={id}
                onClick={navigate(id)}
                button
              >
                <ListItemText primary={getFileName(path)} />
              </ListItem>
            ))
          }
        </List>
      </CardContent>
    </Card>
  )
}

export default CapturedVideoCard
