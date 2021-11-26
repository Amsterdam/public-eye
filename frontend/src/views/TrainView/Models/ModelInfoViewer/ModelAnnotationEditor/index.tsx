import React, { useState, useEffect, useCallback } from 'react'
import { useThunkDispatch } from 'store'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import TextField from '@material-ui/core/TextField'
import CardActions from '@material-ui/core/CardActions'
import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'
import updateModel from 'thunks/training/updateModel'

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(2),
    height: 300,
    width: 300,
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
}))

const ModelAnnotationEditor = ({
  modelId,
  initialAnnotation,
}: {
  modelId: number,
  initialAnnotation: string,
}): JSX.Element => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [annotation, setAnnotation] = useState('')

  useEffect(() => {
    if (initialAnnotation) {
      setAnnotation(initialAnnotation)
    } else {
      setAnnotation('')
    }
  }, [initialAnnotation])

  const commitUpdate = useCallback(() => {
    dispatch(updateModel(modelId, annotation))
  }, [annotation, dispatch, modelId])

  return (
    <div>
      <Card className={classes.root}>
        <CardHeader title="Edit model annotation" />
        <CardContent>
          <TextField
            multiline
            fullWidth
            label="annotation"
            variant="outlined"
            rows={5}
            value={annotation}
            onChange={(e) => setAnnotation(e.target.value)}
          />
        </CardContent>
        <CardActions>
          <Button
            color="primary"
            onClick={commitUpdate}
          >
            edit
          </Button>
        </CardActions>
      </Card>
    </div>
  )
}

export default ModelAnnotationEditor
