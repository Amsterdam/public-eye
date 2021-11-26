// @ts-nocheck
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import createDataset from 'thunks/jobs/createObjectDataset'
import createDatasetFromCollection from 'thunks/jobs/createObjectDatasetFromCollection'
import { useSelectedId } from 'utils'

const useStyles = makeStyles((theme) => ({
  content: {
    width: 500,
  },
  textField: {
    margin: theme.spacing(1),
  },
}))

type PropsType = {
  selectedFrameIds: number[],
  handleClose: () => null,
}

const ObjectContent = (props: PropsType): JSX.Element => {
  const {
    selectedFrameIds,
    handleClose,
  } = props

  const dispatch = useDispatch()
  const classes = useStyles()
  const [datasetName, setDatasetName] = useState('')

  const selectedId = useSelectedId()
  const changeTextField = (changeFunction: React.Dispatch<React.SetStateAction<string>>) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    changeFunction(e.target.value)
  }

  const onCreateDataset = () => {
    if (selectedFrameIds.length === 0 && selectedId) {
      const scriptArgs = {
        nn_type: 'object_recogniton',
        dataset_name: datasetName,
        collection_id: selectedId,
      }
      dispatch(createDatasetFromCollection(scriptArgs))
    } else {
      const scriptArgs = {
        nn_type: 'object_recogniton',
        dataset_name: datasetName,
        frames: selectedFrameIds,
      }
      dispatch(createDataset(scriptArgs))
    }
    handleClose()
  }

  return (
    <>
      <DialogContent className={classes.content}>
        <TextField
          fullWidth
          label="Dataset Name"
          onChange={changeTextField(setDatasetName)}
          className={classes.textField}
          value={datasetName}
        />
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
          onClick={handleClose}
        >
          cancel
        </Button>
        <Button
          color="primary"
          disabled={datasetName === ''}
          onClick={onCreateDataset}
        >
          process
        </Button>
      </DialogActions>
    </>
  )
}

export default ObjectContent
