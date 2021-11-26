// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useThunkDispatch } from 'store'
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  makeStyles,
} from '@material-ui/core'
import { Score } from 'types'
import getScores from 'thunks/training/getScores'

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(2),
    minWidth: 300,
    height: 500,
  },
}))

const ScoreCard = ({
  trainingRunId,
  jobStatus,
}: {
  trainingRunId: number | undefined,
  jobStatus: string | undefined,
}): JSX.Element => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [scores, setScores] = useState<Score[]>([])

  useEffect(() => {
    if (trainingRunId) {
      dispatch(getScores(trainingRunId))
        .then((result) => {
          if (result) {
            setScores(result)
          }
        })
    }
  }, [trainingRunId, dispatch, jobStatus])

  return (
    <Card className={classes.root}>
      <CardHeader title="Score" />
      <CardContent>
        {
          scores.length > 0
            ? (
              scores.map(({ score_name: name, score_value: value, id }) => (
                <Typography key={id}>
                  { `${name}: ${value}` }
                </Typography>
              ))
            ) : (
              <Typography>
                Scores will appear when the training run is completed.
              </Typography>
            )
        }
      </CardContent>
    </Card>
  )
}

export default ScoreCard
