import React, {
  useState, useEffect, memo, useCallback,
} from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core/styles'
import { useThunkDispatch } from 'store'
import { useSelector } from 'react-redux'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import Select from '@material-ui/core/Select'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import InputLabel from '@material-ui/core/InputLabel'
import Switch from '@material-ui/core/Switch'
import Box from '@material-ui/core/Box'
import Divider from '@material-ui/core/Divider'
import Tooltip from '@material-ui/core/Tooltip'
import getDatasets from 'thunks/datasets/getDatasets'
import getNeuralNetworks from 'thunks/neuralNetworks/getNeuralNetworks'
import createTrainingRun from 'thunks/training/createTrainingRun'
import getModels from 'thunks/training/getModels'
import getAllModels from 'thunks/training/getAllModels'
import getArgumentsSpec from 'thunks/jobs/getArgumentsSpec'
import { useMountEffect } from 'utils'
import {
  Dataset,
  NeuralNetwork,
  Model,
} from 'types'
import ModelSelector from 'common/ModelSelector'
import GpuSelector from 'common/GpuSelector'
import GpuInfo from 'common/GpuInfo/Info'
import { RootState } from 'reducers'
import DatasetSelector from './DatasetSelector'

const useStyles = makeStyles((theme) => ({
  root: {
    // minWidth: 700,
  },
  formControl: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
    width: 200,
  },
  content: {
    minWidth: 500,
    // display: 'flex',
  },
  switch: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
  },
  textField: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
    width: 200,
  },
  lastFew: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
  },
  extraArguments: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
  },
  gpuSelectorContainer: {
    width: 200,
  },
}))

const useDatasetsByNNType = (nnType: string | undefined): Dataset[] => {
  const dispatch = useThunkDispatch()
  const [nnTypeToDatasets, setNnTypeToDatasets] = useState<Record<string, Dataset[]>>({})

  const trimmed = nnType ? nnType.replace('_transformer', '') : nnType

  useEffect(() => {
    if (trimmed === undefined) {
      return
    }

    if (!nnTypeToDatasets[trimmed]) {
      dispatch(getDatasets(null, null, trimmed))
        .then((result) => {
          if (result) {
            setNnTypeToDatasets((old) => ({
              ...old,
              [trimmed]: result,
            }))
          }
        })
    }
  }, [trimmed, nnTypeToDatasets, dispatch])

  return trimmed && nnTypeToDatasets[trimmed]
    ? nnTypeToDatasets[trimmed]
    : []
}

const checkJson = (jsonString: string): boolean => {
  try {
    if (jsonString === '') {
      return true
    }
    JSON.parse(jsonString)
    return true
  } catch {
    return false
  }
}

const useArgumentsSpec = (trainScript: string): Record<string, any> | null => {
  const dispatch = useThunkDispatch()
  const argSpec = useSelector((state: RootState) => state.jobs.jobArgumentsSpec)

  React.useEffect(() => {
    if (argSpec === null) {
      dispatch(getArgumentsSpec())
    }
  }, [trainScript, argSpec, dispatch])

  const defaultArgs = React.useMemo(() => {
    if (argSpec !== null && argSpec[trainScript]) {
      return R.pipe(
        Object.entries,
        // eslint-disable-next-line
        R.filter(([, { default: defaultValue }]) => defaultValue),
        // eslint-disable-next-line
        R.map(([argName, { default: defaultValue }]) => [argName, defaultValue]),
        R.fromPairs,
      )(argSpec[trainScript])
    }

    return null
  }, [argSpec, trainScript])

  return defaultArgs
}

const TrainingJobDialog = ({
  open,
  setOpen,
  preset,
}: {
  open: boolean,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  preset: Record<string, unknown>,
}) => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const handleClose = () => setOpen(false)
  const [name, setName] = useState('')
  const [neuralNetworks, setNeuralNetworks] = useState<NeuralNetwork[]>([])
  const [trainDataset, setTrainDataset] = useState(0)
  const [valDataset, setValDataset] = useState(0)
  const [lastFewLayers, setLastFewLayers] = useState('')
  const [trainScript, setTrainScript] = useState('')
  const [usePretrainedModel, setUsePretrainedModel] = useState(false)
  const [preTrainedModel, setPretrainedModel] = useState('')
  const [preTrainedModels, setPretrainedModels] = useState([])
  const [models, setModels] = useState<Model[]>([])
  const [extraArguments, setExtraArguments] = useState('')
  const [selectedGpu, setSelectedGpu] = useState(null)

  const selectedNn = neuralNetworks.find(({ id }) => Number(trainScript) === id)
  const argSpec = useArgumentsSpec(selectedNn && selectedNn.train_script)

  React.useEffect(() => {
    if (argSpec) {
      setExtraArguments(JSON.stringify(argSpec, null, 4))
    } else {
      setExtraArguments('')
    }
  }, [argSpec])

  useMountEffect(() => {
    dispatch(getNeuralNetworks())
      .then((result) => {
        if (result) {
          setNeuralNetworks(result)
        }
      })
    dispatch(getAllModels())
      .then((result) => {
        if (result) {
          setModels(result.items)
        }
      })
  })

  // initialize from preset
  useEffect(() => {
    if (open) {
      if (preset) {
        const {
          model_name: modelName,
          scriptName,
          train_dataset_id: trainDatasetId,
          val_dataset_id: valDatasetId,
          pretrained_model_id: pretrainedModelId,
          train_last_layers: trainLastLayers,
          selected_gpu: tempSelectedGpu,
          ...rest
        } = preset

        if (scriptName) {
          const presetTrainScript = neuralNetworks.find(
            ({ train_script: tempTrainScript }) => scriptName === tempTrainScript,
          )

          if (presetTrainScript && presetTrainScript.id) {
            setTrainScript(presetTrainScript.id)
          }
        }
        if (trainDatasetId) {
          setTrainDataset(trainDatasetId)
        }
        if (valDatasetId) {
          setValDataset(valDatasetId)
        }
        if (pretrainedModelId) {
          setUsePretrainedModel(true)
          setPretrainedModel(pretrainedModelId)

          if (trainLastLayers) {
            setLastFewLayers(trainLastLayers)
          }
        }
        if (tempSelectedGpu) {
          setSelectedGpu(tempSelectedGpu)
        }
        if (rest) {
          setExtraArguments(JSON.stringify(rest))
        }
      }
    }
  }, [open, preset, neuralNetworks])

  const datasets = useDatasetsByNNType(selectedNn && selectedNn.nn_type)

  const submitTrainingRun = useCallback(() => {
    if (!selectedNn) {
      return
    }
    if (!checkJson(extraArguments)) {
      alert('EXTRA ARGUMENTS MALFORMED')
    }

    const trainScriptName = selectedNn && selectedNn.train_script

    let scriptArgs: Record<string, number | string | null> = {
      train_dataset_id: trainDataset,
      val_dataset_id: valDataset,
      model_name: name,
      pretrained_model_id: usePretrainedModel ? preTrainedModel : null,
      train_last_layers: lastFewLayers !== '' ? lastFewLayers : null,
      selected_gpu: selectedGpu,
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      scriptArgs = {
        ...scriptArgs,
        ...JSON.parse(extraArguments),
      }
    } catch (e) {
      return
    }

    const payload = {
      scriptName: trainScriptName,
      scriptArgs,
    }

    dispatch(createTrainingRun(payload))

    setOpen(false)
  }, [dispatch, extraArguments, lastFewLayers, name,
    preTrainedModel, selectedGpu, setOpen,
    trainDataset, usePretrainedModel, valDataset, selectedNn])

  useEffect(() => {
    let mounted = true

    if (trainScript !== '' && mounted) {
      dispatch(getModels(trainScript))
        .then((result) => {
          setPretrainedModels(result)
        })
    }

    return () => {
      mounted = false
    }
  }, [trainScript, dispatch])

  const changeLastFewLayers = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setLastFewLayers('')
      return
    }
    const casted = Number(e.target.value)
    if (Number.isInteger(casted)) {
      setLastFewLayers(casted)
    }
  }, [])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className={classes.root}
    >
      <DialogTitle>
        Start a new training job
      </DialogTitle>
      <DialogContent className={classes.content}>
        <GpuInfo open={open} />
        <Box
          marginBottom={2}
          marginRight={2}
          marginLeft={2}
        >
          <Divider />
        </Box>
        <Box display="flex">
          <div>
            <TextField
              placeholder="Name"
              label="name"
              InputLabelProps={{
                shrink: true,
              }}
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              helperText="Choose unique model name."
              error={models.some(({ name: modelName }) => name === modelName)}
              className={classes.textField}
              variant="outlined"
            />
            <div>
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel>
                  Train Script
                </InputLabel>
                <Select
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => (
                    setTrainScript(e.target.value)
                  )}
                  value={trainScript}
                >
                  {
                    neuralNetworks
                      .filter(({ hidden_to_user }: { hidden_to_user: boolean }) => !hidden_to_user)
                      .map(({ id, train_script: scriptName, name: nnName }, index) => (
                        <MenuItem key={index} value={id}>
                          {nnName || scriptName}
                        </MenuItem>
                      ))
                  }
                </Select>
              </FormControl>
            </div>
            <div>
              <DatasetSelector
                title="Train Dataset"
                value={String(trainDataset)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setTrainDataset(e.target.value)
                  if (selectedNn && selectedNn.nn_type === 'line_crossing_density') {
                    setValDataset(e.target.value)
                  }
                }}
                datasets={datasets}
              />
            </div>
            <div>
              <DatasetSelector
                title="Validation Dataset"
                value={String(valDataset)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValDataset(e.target.value)}
                datasets={datasets}
                disabled={selectedNn && selectedNn.nn_type === 'line_crossing_density'}
              />
            </div>
            <div className={classes.gpuSelectorContainer}>
              <GpuSelector
                selectedGpu={selectedGpu}
                setSelectedGpu={setSelectedGpu}
              />
            </div>
            <FormControlLabel
              control={(
                <Switch
                  checked={usePretrainedModel}
                  onChange={(e) => setUsePretrainedModel(e.target.checked)}
                  value="checked"
                  color="primary"
                />
              )}
              label="Use pretrained model"
              className={classes.switch}
            />

            {
              usePretrainedModel
              && (
                <>
                  <Tooltip
                    title="
                      Using a pretrained model initializes the model at the start of training
                      with an already trained model.
                    "
                  >
                    <Box padding={2}>
                      <ModelSelector
                        onChange={(value) => {
                          setPretrainedModel(value)
                        }}
                        value={preTrainedModel}
                        network={selectedNn && selectedNn.id}
                      />
                    </Box>
                  </Tooltip>
                  <Tooltip
                    title="This argument should be an integer that signifies to only train the last X layers
                      of the network. For example: if a network has 10 layers and this argument is set to 5,
                      the first five layers of the network are not modified by backwards propogation while
                      the last 5 layers are modified.
                    "
                  >
                    <TextField
                      className={classes.textField}
                      disabled={!trainScript}
                      variant="outlined"
                      label="Only train the last X layers"
                      value={lastFewLayers}
                      onChange={changeLastFewLayers}
                    />
                  </Tooltip>
                </>
              )

            }
          </div>
          <div>
            <TextField
              className={classes.extraArguments}
              multiline
              rows={16}
              variant="outlined"
              label="Extra arguments"
              error={!checkJson(extraArguments)}
              helperText="Insert JSON formatted extra arguments for the training run"
              value={extraArguments}
              onChange={(e) => setExtraArguments(e.target.value)}
            />
          </div>
        </Box>
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
          onClick={submitTrainingRun}
          disabled={
            trainDataset === null
            || !checkJson(extraArguments)
            || valDataset === null
            || name === ''
            || models.some(({ name: modelName }) => name === modelName)
          }
        >
          train
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const areEqual = (prevProps, nextProps) => R.equals(prevProps, nextProps)

export default memo(TrainingJobDialog, areEqual)
