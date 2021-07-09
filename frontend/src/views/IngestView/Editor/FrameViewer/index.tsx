import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import getFrameById from 'thunks/frames/getFrameById'
import EmptyFallbackProgress from 'common/EmptyFallbackProgress'
import { Frame } from 'types'
import { useIngestPath } from 'utils'
import { RootState } from 'reducers'
import Density from './Density'
import Object from './Object'
import SpeedDial from './SpeedDial'

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(4),
  },
  header: {
    display: 'flex',
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(2),
    justifyContent: 'space-between',
  },
  button: {
    margin: theme.spacing(1),
  },
}))

const useFrame = (frameId: string | undefined) => {
  const dispatch = useThunkDispatch()
  const frame = useSelector((state: RootState) => state.frames[Number(frameId)] || null)

  React.useEffect(() => {
    if (frameId === undefined || frame !== null) {
      return
    }

    dispatch(getFrameById(frameId))
  }, [dispatch, frameId, frame])

  return frame
}

const FrameViewer = ({
  frame,
}: {
  frame: Frame,
}) => {
  const [tabSelected, setTabSelected] = useState(0)
  const classes = useStyles()
  const [width, setWidth] = useState('100%')

  const handleChange = (event, newValue) => {
    setTabSelected(newValue)
  }

  useEffect(() => {
    if (tabSelected === 0) {
      setWidth('80%')
    }
  }, [setWidth, tabSelected])

  return (
    <>
      <Paper className={classes.root}>
        <div className={classes.header}>
          <Tabs
            onChange={handleChange}
            value={tabSelected}
          >
            <Tab label="Density Estimation" />
            <Tab label="Object Recognition" />
          </Tabs>
        </div>
        {
          tabSelected === 0
            ? <Density frame={frame} />
            : <Object frame={frame} width={width} setWidth={setWidth} />
        }
      </Paper>
      <SpeedDial
        frame={frame}
      />
    </>
  )
}

const WrapFrame = () => {
  const { frameId } = useIngestPath()
  const frame = useFrame(frameId)

  return (
    <EmptyFallbackProgress
      isEmpty={frame === null}
    >
      <FrameViewer frame={frame} />
    </EmptyFallbackProgress>
  )
}

export default WrapFrame
