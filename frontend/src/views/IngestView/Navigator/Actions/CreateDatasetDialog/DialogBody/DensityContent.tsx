// @ts-nocheck
import React, { useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContentText from '@material-ui/core/DialogContentText'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import createDensityDataset from 'thunks/jobs/createDensityDataset'
import createDensityDatasetFromCollection from 'thunks/jobs/createDensityDatasetFromCollection'
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

const DensityContent = (props: PropsType): React.ReactElement => {
  const {
    selectedFrameIds,
    handleClose,
  } = props

  const dispatch = useDispatch()
  const selectedId = useSelectedId()
  const classes = useStyles()
  const [sigma, setSigma] = useState('12')
  const [beta, setBeta] = useState('-1')
  const [datasetName, setDatasetName] = useState('')

  const changeTextField = (changeFunction: React.Dispatch<React.SetStateAction<string>>) => (
    (e: React.ChangeEvent<HTMLInputElement>) => changeFunction(e.target.value)
  )

  const onCreateDataset = useMemo(() => {
    if (selectedFrameIds.length === 0 && selectedId) {
      return () => {
        const scriptArgs = {
          dataset_name: datasetName,
          collection_id: selectedId,
          nn_type: 'density_estimation',
          density_config: {
            sigma: Number(sigma),
            beta: Number(beta),
          },
        }
        dispatch(createDensityDatasetFromCollection(scriptArgs))
        handleClose()
      }
    }
    return () => {
      const scriptArgs = {
        dataset_name: datasetName,
        frames: selectedFrameIds,
        nn_type: 'density_estimation',
        density_config: {
          sigma: Number(sigma),
          beta: Number(beta),
        },
      }
      dispatch(createDensityDataset(scriptArgs))
      handleClose()
    }
  }, [beta, datasetName, dispatch, handleClose, selectedFrameIds,
    sigma, selectedId])

  return (
    <>
      <DialogContent className={classes.content}>
        <DialogContentText>
          Select the sigma and beta values to generate the ground thruths and
          process the frames into a dataset.
        </DialogContentText>
        <TextField
          fullWidth
          label="Dataset Name"
          onChange={changeTextField(setDatasetName)}
          className={classes.textField}
          value={datasetName}
        />
        <TextField
          label="Sigma"
          className={classes.textField}
          value={sigma}
          onChange={changeTextField(setSigma)}
        />
        <TextField
          label="Beta"
          className={classes.textField}
          value={beta}
          onChange={changeTextField(setBeta)}
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
          disabled={sigma === '' || beta === '' || datasetName === ''}
          onClick={onCreateDataset}
        >
          process
        </Button>
      </DialogActions>
    </>
  )
}

export default DensityContent
