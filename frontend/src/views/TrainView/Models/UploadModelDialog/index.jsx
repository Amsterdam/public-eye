import React, { useState, useEffect } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useThunkDispatch } from 'store'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import FormControl from '@material-ui/core/FormControl'
import getAllModels from 'thunks/training/getAllModels'
import getNeuralNetworks from 'thunks/neuralNetworks/getNeuralNetworks'
import uploadModel from 'thunks/neuralNetworks/uploadModel'
import { VoidFunction } from 'types'

const useStyles = makeStyles((theme) => ({
  root: {
    // width: 400,
  },
  formControl: {
    width: 200,
    padding: theme.spacing(1),
  },
  file: {
    padding: theme.spacing(1),
    width: 200,
  },
  fileInput: {
    width: 200,
  },
  textField: {
    padding: theme.spacing(1),
    width: 200,
  },
}))

const UploadModelDialog = ({
  open,
  handleClose,
}: {
  open: boolean,
  handleClose: VoidFunction,
}) => {
  const dispatch = useThunkDispatch()
  const classes = useStyles()
  const [files, setFiles] = useState(null)
  const [neuralNetworks, setNeuralNetworks] = useState([])
  const [models, setModels] = useState([])
  const [trainScript, setTrainScript] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    let mounted = true
    dispatch(getNeuralNetworks())
      .then((result) => {
        if (result && mounted) {
          setNeuralNetworks(result)
        }
      })
    dispatch(getAllModels())
      .then((result) => {
        if (result && mounted) {
          setModels(result)
        }
      })

    return () => {
      mounted = false
    }
  }, [dispatch])

  const commitUpload = () => {
    dispatch(uploadModel(trainScript, files, name))
    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className={classes.root}
    >
      <DialogTitle>
        Upload model
      </DialogTitle>
      <DialogContent>
        <div>
          <FormControl variant="outlined" className={classes.formControl}>
            <InputLabel>
              Train Script
            </InputLabel>
            <Select
              onChange={(e) => setTrainScript(e.target.value)}
              value={trainScript}
            >
              {
                neuralNetworks.map(({ id, train_script: scriptName }) => (
                  <MenuItem key={id} value={id}>
                    {scriptName}
                  </MenuItem>
                ))
              }
            </Select>
          </FormControl>
        </div>
        <div className={classes.file}>
          <input
            className={classes.fileInput}
            type="file"
            onChange={(e) => setFiles(e.target.files)}
          />
        </div>
        <div className={classes.textField}>
          <TextField
            label="name"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
          onClick={commitUpload}
          disabled={
            name === ''
            || trainScript === ''
            || models.some(({ name: modelName }) => name === modelName)
          }
        >
          upload
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UploadModelDialog
