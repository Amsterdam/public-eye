import React, { useCallback, useEffect, useState } from 'react'
import {
  append,
  filter,
  values,
  mapObjIndexed,
  pipe,
} from 'ramda'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import Card from '@material-ui/core/Card'
import Chip from '@material-ui/core/Chip'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import insertModelTag from 'thunks/training/insertModelTag'
import Autocomplete from '@material-ui/lab/Autocomplete'
import insertModelTagLink from 'thunks/training/insertModelTagLink'
import deleteModelTagLink from 'thunks/training/deleteModelTagLink'
import getTagsForModel from 'thunks/training/getTagsForModel'
import { ModelTag } from 'types'
import { RootState } from 'reducers'

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(2),
    height: 300,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
  },
  button: {
    margin: theme.spacing(1),
  },
  autocomplete: {
    marginTop: theme.spacing(1),
    width: 300,
  },
}))

type ModelTagsEditorProps = {
  modelId: number,
}

const ModelTagsEditor = (props: ModelTagsEditorProps): React.ReactElement => {
  const {
    modelId,
  } = props

  const modelTags = useSelector((state: RootState) => state.training.modelTags)
  const [newTagName, setNewTagName] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const classes = useStyles()
  const dispatch = useThunkDispatch()

  useEffect(() => {
    dispatch(getTagsForModel(modelId))
      .then((result) => {
        if (result) {
          setSelectedTags(result)
        }
      })
  }, [dispatch, modelId])

  const submitFunction = useCallback(() => {
    dispatch(insertModelTag(newTagName))
  }, [dispatch, newTagName])

  const handleChange = useCallback((e, state, actionType, { option }: { option: ModelTag }) => {
    if (actionType === 'select-option') {
      dispatch(insertModelTagLink(modelId, option.id))
        .then((success) => {
          if (success) {
            setSelectedTags((oldState) => append(option)(oldState))
          }
        })
    }
    if (actionType === 'remove-option') {
      dispatch(deleteModelTagLink(modelId, option.id))
        .then((success) => {
          if (success) {
            setSelectedTags((oldState) => filter(({ id }) => id !== option.id)(oldState))
          }
        })
    }
  }, [dispatch, modelId])

  return (
    <div>
      <Card className={classes.root}>
        <CardHeader title="Edit model tags" />
        <CardContent>
          <div className={classes.row}>
            <TextField
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              variant="outlined"
              label="new tag"
              margin="dense"
            />
            <Button
              className={classes.button}
              variant="contained"
              color="primary"
              onClick={submitFunction}
            >
              submit
            </Button>
          </div>
          <Autocomplete
            className={classes.autocomplete}
            multiple
            options={modelTags}
            getOptionLabel={(tag) => tag.name}
            value={selectedTags}
            onChange={handleChange}
            // custom equality check because elements are objects
            // getOptionSelected={(option) => R.includes(option)(selectedTags)}
            filterSelectedOptions
            disableClearable
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                label="model tags"
              />
            )}
            renderTags={(value, getTagProps) => pipe(
              mapObjIndexed((option: ModelTag, index) => (
                <Chip
                  size="small"
                  key={option.id}
                  variant="outlined"
                  label={option.name}
                  {...getTagProps({ index })}
                />
              )),
              values,
            )(value)}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default ModelTagsEditor
