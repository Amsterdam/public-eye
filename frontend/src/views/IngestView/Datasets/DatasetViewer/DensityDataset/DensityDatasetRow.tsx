import React, { memo } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector } from 'react-redux'
import { getToken, getFileName } from 'utils'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { RootState } from 'reducers'

const useStyles = makeStyles((theme) => ({
  image: {
    width: '100%',
    height: 'auto',
  },
  paper: {
    padding: theme.spacing(1),
  },
}))

type DensityDatasetRowProps = {
  entry: {
    frame_path: string,
    frame_id: number,
    gt_id: number,
  },
}

const DensityDatasetRow = ({ entry }: DensityDatasetRowProps) => {
  const token = getToken()
  const classes = useStyles()
  const baseUrl = useSelector((state: RootState) => state.general.baseUrl)
  const makeFrameUrl = (id: number) => `${baseUrl}/files/frames/${id}?tk=${token}`
  const makeGtUrl = (id: number) => `${baseUrl}/files/ground_truth/${id}?tk=${token}`

  return (
    <Grid item xs={6}>
      <Paper square className={classes.paper}>
        <Grid spacing={1} container>
          <Grid item xs={6}>
            <div className={classes.image}>
              <img alt="frame" src={makeFrameUrl(entry.frame_id)} className={classes.image} />
            </div>
          </Grid>
          <Grid item xs={6}>
            <img alt="grount_truth" src={makeGtUrl(entry.gt_id)} className={classes.image} />
          </Grid>
          <Grid container justify="center">
            <Typography>
              { getFileName(entry.frame_path) }
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  )
}

export default memo(DensityDatasetRow)
