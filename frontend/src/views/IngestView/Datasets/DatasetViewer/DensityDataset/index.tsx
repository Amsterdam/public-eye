import React, { useState, useEffect } from 'react'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import getFramesAndLabelsForDataset from 'thunks/datasets/getFramesAndLabelsForDataset'
import { useSelectedId } from 'utils'
import { Frame } from 'types'
import DensityDatasetRow from './DensityDatasetRow'

const useStyles = makeStyles((theme) => ({
  root: {
    height: `calc(100vh - ${theme.spacing(17)}px)`,
    overflow: 'auto',
    padding: theme.spacing(4),
  },
}))

type FrameWithGroundTruth = {
  frame_path: string,
  frame_id: number,
  gt_id: number,
}

const DensityDataset = (): React.ReactElement => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const selectedId = useSelectedId()

  const [framesAndGts, setFramesAndGts] = useState([])

  useEffect(() => {
    if (selectedId === null) return
    dispatch(getFramesAndLabelsForDataset(selectedId))
      .then(setFramesAndGts)
  }, [selectedId, dispatch])

  return (
    <div className={classes.root}>
      <Grid spacing={2} container>
        {framesAndGts.map((entry: FrameWithGroundTruth) => (
          <DensityDatasetRow
            key={entry.frame_path}
            entry={entry}
          />
        ))}
      </Grid>
      {
        framesAndGts.length === 0
        && (
          <Typography>
            This dataset does not contain any frames.
          </Typography>
        )
      }
    </div>
  )
}

export default DensityDataset
