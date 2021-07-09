import React, {
  useState, useEffect, useMemo, useCallback,
} from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector, batch } from 'react-redux'
import { useThunkDispatch } from 'store'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import TextField from '@material-ui/core/TextField'
import Box from '@material-ui/core/Box'
import InputLabel from '@material-ui/core/InputLabel'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import FormHelperText from '@material-ui/core/FormHelperText'
import RegionOfInterest from 'common/RegionOfInterest'
import LineOfInterest from 'common/LineOfInterest'
import getNeuralNetworks from 'thunks/neuralNetworks/getNeuralNetworks'
import getStreamCaptureByCameraId from 'thunks/cameras/getStreamCaptureByCameraId'
import getRois from 'thunks/cameras/getRois'
import getLois from 'thunks/cameras/getLois'
import GpuSelector from 'common/GpuSelector'
import ModelSelector from 'common/ModelSelector'
import { RootState } from 'reducers'
import { Camera, StreamLoi, StreamRoi } from 'types'
import { StreamArgs } from '../defaultStream'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  formControl: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    minWidth: '90%',
    maxWidth: '90%',
  },
  textField: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    minWidth: '90%',
  },
  checkBoxes: {
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
    margin: theme.spacing(1),
  },
  content: {
    display: 'flex',
  },
  gpuSelectorContainer: {
    width: '90%',
  },
  streamCapture: {
    width: 400,
  },
  streamCaptureContainer: {
    width: 400,
  },
  rightColumn: {
    margin: theme.spacing(1),
    padding: theme.spacing(1),
  },
  leftColumn: {
    maxWidth: 450,
    minWidth: 450,
  },
}))

const CameraForm = ({
  preset,
  args,
  setArgs,
  multicapture,
}: {
  preset: StreamArgs,
  args: StreamArgs,
  setArgs: (args: StreamArgs) => void,
  multicapture: boolean
}) => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const streamInstances = useSelector((state: RootState) => (
    Array.from(state.deploys.values())
      .filter(({ job_script_path: jobScriptPath }) => jobScriptPath.includes('stream_capture.py'))
  ))
  const cameras = useSelector((state: RootState) => state.cameras)

  const camerasStreamUrlToId: Record<string, number> = useMemo(() => R.pipe(
    R.map(({ id, stream_url: streamUrl }: Camera) => ([streamUrl, id])),
    R.fromPairs,
  )(Array.from(cameras.values())), [cameras])

  const [neuralNetworks, setNeuralNetworks] = useState([])
  const [rois, setRois] = useState([])
  const [lois, setLois] = useState([])

  // initialize from preset
  useEffect(() => {
    let mounted = true
    if (preset && mounted) {
      setArgs((tempArgs: StreamArgs): StreamArgs => ({ ...tempArgs, ...preset }))
    }
    return () => { mounted = false }
  }, [preset, setArgs])

  const [streamCapture, setStreamCapture] = useState(null)

  useEffect(() => {
    let mounted = true
    if (streamCapture) {
      dispatch(getRois(streamCapture.camera_id))
        .then((result) => {
          if (result && mounted) {
            setRois(result)
          }
        })
    }
    return () => { mounted = false }
  }, [streamCapture, dispatch])

  useEffect(() => {
    let mounted = true
    if (streamCapture) {
      dispatch(getLois(streamCapture.camera_id))
        .then((result) => {
          if (result && mounted) {
            setLois(result)
          }
        })
    }
    return () => { mounted = false }
  }, [streamCapture, dispatch])

  useEffect(() => {
    let mounted = true
    dispatch(getNeuralNetworks())
      .then((tempNeuralNetworks) => {
        if (tempNeuralNetworks && mounted) {
          setNeuralNetworks(tempNeuralNetworks)
        }
      })

    return () => { mounted = false }
  }, [dispatch])

  const neuralNetworkType = useMemo(() => {
    if (!args.network) {
      return ''
    }
    const nn = neuralNetworks.find(({ id }) => id === args.network)
    if (nn) {
      return nn.nn_type as string
    }
    return ''
  }, [args.network, neuralNetworks])

  const selectedRoi = rois.find(({ id }) => id === args.roi_id)
  const selectedLoi = lois.find(({ id }) => id === args.loi_id)

  // might be ineffecient
  const nameUsedOrSlash = useMemo(() => (
    Array.from(streamInstances.values()).some(({ name: streamInstanceName }) => args.name === streamInstanceName) || args.name.includes('/')
  ), [streamInstances, args.name])

  const lineSelected = useMemo(() => (
    neuralNetworkType === 'line_crossing_density' && args.loi_id === undefined
  ), [neuralNetworkType, args.loi_id])

  const textFieldSetter = useCallback(
    (key) => (e: React.ChangeEvent<HTMLInputElement>) => {
      e.persist()
      setArgs((tempArgs: StreamArgs) => ({ ...tempArgs, [key]: e.target.value }))
    }, [setArgs],
  )

  const checkBoxSetter = useCallback(
    (key) => (e: React.ChangeEvent<HTMLInputElement>) => {
      e.persist()
      setArgs((tempArgs: StreamArgs) => ({ ...tempArgs, [key]: e.target.checked }))
    }, [setArgs],
  )

  const plainSetter = useCallback(
    (key) => (value: string | number) => (
      setArgs((tempArgs: StreamArgs) => ({
        ...tempArgs, [key]: value,
      }))), [setArgs],
  )

  useEffect(() => {
    setRois([])
    setLois([])

    if (args.stream) {
      const id = camerasStreamUrlToId[args.stream]

      dispatch(getStreamCaptureByCameraId(id))
        .then((result) => {
          batch(() => {
            setStreamCapture(result)
          })
        })
    }
  }, [args.stream, dispatch, camerasStreamUrlToId])

  // when stream is changed via textfield the region of interest should be reset
  const setStream = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setArgs((tempArgs: StreamArgs) => ({
      ...tempArgs,
      stream: e.target.value,
      roi_id: null,
    }))
  }, [setArgs])

  const rightColumn = useMemo(() => {
    if (neuralNetworkType === 'density_estimation') {
      return (
        <>
          <div>
            <TextField
              className={classes.textField}
              InputLabelProps={{ shrink: true }}
              label="Subtraction Bias for Density Estimation"
              value={args.bias || ''}
              onChange={textFieldSetter('bias')}
            />
          </div>
          <div className={classes.checkBoxes}>
            <FormControlLabel
              control={(
                <Checkbox
                  value={args.show_heatmap}
                  checked={args.show_heatmap}
                  onChange={checkBoxSetter('show_heatmap')}
                  name="Show Heatmap"
                />
              )}
              label="Show Heatmap"
            />
          </div>
          <div>
            <TextField
              className={classes.textField}
              InputLabelProps={{ shrink: true }}
              label="Sliding Window"
              value={args.sliding_window || ''}
              helperText="Supply integer value to use sliding window of that size"
              onChange={textFieldSetter('sliding_window')}
            />
          </div>
        </>
      )
    }
    if (neuralNetworkType === 'object_recognition') {
      return (
        <>
          <div>
            <TextField
              InputLabelProps={{ shrink: true }}
              className={classes.textField}
              value={args.non_max_suppression}
              label="Non-Max Suppresion"
              onChange={textFieldSetter('non_max_suppression')}
              helperText="Enter value between 0 and 1"
            />
          </div>
          <div>
            <TextField
              InputLabelProps={{ shrink: true }}
              className={classes.textField}
              value={args.object_threshold}
              label="Object Threshold"
              onChange={textFieldSetter('object_threshold')}
              helperText="Enter value between 0 and 1"
            />
          </div>
        </>
      )
    }

    if (neuralNetworkType === 'line_crossing_density') {
      return (
        <>
          <FormControl variant="outlined" className={classes.formControl}>
            <InputLabel htmlFor="loi-selector">
              Line of Interest
            </InputLabel>
            <Select
              disabled={!streamCapture}
              onChange={textFieldSetter('loi_id')}
              value={args.loi_id || ''}
              inputProps={{
                id: 'loi-selector',
              }}
              error={lineSelected}
            >
              {
                lois.map(({ id, name }) => (
                  <MenuItem key={id} value={id}>
                    {name}
                  </MenuItem>
                ))
              }
            </Select>
          </FormControl>
          <LineOfInterest
            imageWidth={350}
            streamCapture={streamCapture}
            areaPoints={selectedLoi ? selectedLoi.polygons as StreamLoi : []}
          />
        </>
      )
    }

    return ''
  }, [neuralNetworkType, args.bias, classes.checkBoxes, classes.textField, args.non_max_suppression,
    args.object_threshold, args.show_heatmap, args.sliding_window, checkBoxSetter, textFieldSetter,
    args.loi_id, lois, classes.formControl, lineSelected, selectedLoi, streamCapture])

  const changeNetwork = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist()
    setArgs((tempArgs: StreamArgs) => ({
      ...tempArgs,
      network: e.target.value,
      model: null,
    }))
  }, [setArgs])

  return (
    <div className={classes.root}>
      <div>
        <div className={classes.leftColumn}>
          {
            !multicapture
            && (
              <div>
                <TextField
                  value={args.name}
                  onChange={textFieldSetter('name')}
                  label="Name"
                  className={classes.textField}
                  helperText="Choose unique stream instance name without the / character."
                  error={nameUsedOrSlash}
                />
              </div>
            )
          }
          <div>
            <FormControl className={classes.formControl}>
              <InputLabel>stream url</InputLabel>
              <Select
                value={args.stream}
                onChange={setStream}
              >
                {
                  Array.from(cameras.values()).map(({ id, stream_url: streamUrl, name }) => (
                    <MenuItem key={id} value={streamUrl}>{ name || streamUrl }</MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </div>
          <div>
            <TextField
              value={args.callback_urls}
              onChange={textFieldSetter('callback_urls')}
              label="Callback URL"
              className={classes.textField}
            />
          </div>
          <div>
            <TextField
              value={args.scale_factor}
              onChange={textFieldSetter('scale_factor')}
              label="Scale Factor"
              className={classes.textField}
            />
          </div>
          {
            !multicapture
            && (
              <div>
                <TextField
                  value={args.output_scale_factor}
                  onChange={textFieldSetter('output_scale_factor')}
                  label="Output scale factor"
                  className={classes.textField}
                />
              </div>
            )
          }
          {
            !multicapture
            && (
              <div>
                <TextField
                  value={args.output_fps}
                  onChange={textFieldSetter('output_fps')}
                  label="FPS output stream"
                  className={classes.textField}
                />
              </div>
            )
          }
          <div>
            <FormControl variant="outlined" className={classes.formControl}>
              <InputLabel htmlFor="pretrained-dataset-selector">
                Neural Network
              </InputLabel>
              <Select
                onChange={changeNetwork}
                value={args.network}
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
          <Box width="90%">
            <ModelSelector
              network={args.network}
              value={args.model}
              onChange={plainSetter('model')}
            />
          </Box>
          <div>
            <div className={classes.checkBoxes}>
              {
                !multicapture
                && (
                  <FormControlLabel
                    control={(
                      <Checkbox
                        value={args.save_images}
                        checked={args.save_images}
                        onChange={checkBoxSetter('save_images')}
                        name="Save Images"
                      />
                    )}
                    label="Save Images"
                  />
                )
              }
              <FormControlLabel
                control={(
                  <Checkbox
                    value={args.cuda}
                    checked={args.cuda}
                    onChange={checkBoxSetter('cuda')}
                    name="Use CUDA"
                  />
                )}
                label="Use CUDA"
              />
              <FormControlLabel
                control={(
                  <Checkbox
                    value={args.social_distance}
                    checked={args.social_distance}
                    onChange={checkBoxSetter('social_distance')}
                    name="Use Social Distancing"
                  />
                )}
                label="Use Social Distancing"
              />
            </div>
            <div className={classes.gpuSelectorContainer}>
              <GpuSelector
                selectedGpu={args.selected_gpu}
                setSelectedGpu={plainSetter('selected_gpu')}
              />
            </div>
          </div>
        </div>
      </div>
      <div className={classes.rightColumn}>
        {
          rois.length > 0 && args.stream && streamCapture
            ? (
              <>
                <FormControl variant="outlined" className={classes.formControl}>
                  <InputLabel htmlFor="roi-selector">
                    Region of Interest
                  </InputLabel>
                  <Select
                    disabled={!streamCapture}
                    onChange={textFieldSetter('roi_id')}
                    value={args.roi_id || ''}
                    inputProps={{
                      id: 'roi-selector',
                    }}
                  >
                    {
                      rois.concat([{ id: '', name: 'no roi' }]).map(({ id, name }) => (
                        <MenuItem key={id} value={id}>
                          {name}
                        </MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>
                <RegionOfInterest
                  imageWidth={350}
                  streamCapture={streamCapture}
                  areaPoints={selectedRoi ? selectedRoi.polygons as StreamRoi : []}
                />
              </>
            ) : (
              <FormHelperText style={{ width: 350 }}>
                No region of interest created yet. Close this window and press and
                the ROI button to create one for this stream.
              </FormHelperText>
            )
          }
        {rightColumn}
      </div>
    </div>
  )
}

export default CameraForm
