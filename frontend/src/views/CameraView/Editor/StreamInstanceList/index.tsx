import React, {
  useEffect, useState, useCallback, useMemo,
} from 'react'
import * as R from 'ramda'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { useThunkDispatch } from 'store'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import getStreamInstancesByCameraId from 'thunks/cameras/getStreamInstancesByCameraId'
import getMultiCapturesByCameraId from 'thunks/cameras/getMultiCapturesByCameraId'
import { useSelectedId } from 'utils'
import { StreamInstance, MultiCapture } from 'types'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    width: 300,
  },
  cardContent: {
    height: 300,
    overflow: 'auto',
  },
}))

const StreamInstanceList = (): React.ReactElement => {
  const cameraId = useSelectedId(['/camera/:id'])
  // @ts-ignore
  const [streamInstances, setStreamInstances] = useState<StreamInstance[]>([])
  // @ts-ignore
  const [multiCaptures, setMultiCaptures] = useState<MultiCapture[]>([])
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const history = useHistory()

  // @ts-ignore
  // eslint-disable-next-line
  const items = useMemo(() => R.pipe(
    // @ts-ignore
    R.concat(multiCaptures),
    // @ts-ignore
    R.sort(R.descend(R.prop('running_job_id'))),
    // @ts-ignore
  )(streamInstances), [multiCaptures, streamInstances]) as (StreamInstance | MultiCapture)[]

  useEffect(() => {
    if (cameraId) {
      // @ts-ignore
      dispatch(getStreamInstancesByCameraId(cameraId))
        .then((result) => {
          // @ts-ignore
          setStreamInstances(result)
        })

      // @ts-ignore
      dispatch(getMultiCapturesByCameraId(cameraId))
        .then((result) => {
          // @ts-ignore
          setMultiCaptures(result)
        })
    }
  }, [dispatch, cameraId])

  const viewStreamInstance = useCallback((index: number) => () => {
    history.push(`/deploy/${index}`)
  }, [history])

  return (
    <>
      <div className={classes.root}>
        <Card>
          <CardHeader title="Stream instances for camera" />
          <CardContent
            className={classes.cardContent}
          >
            <List>
              {items.map(({ name, running_job_id: runningJobId }) => (
                <ListItem
                  button
                  key={runningJobId}
                  onClick={viewStreamInstance(runningJobId)}
                >
                  <ListItemText primary={name} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default StreamInstanceList
