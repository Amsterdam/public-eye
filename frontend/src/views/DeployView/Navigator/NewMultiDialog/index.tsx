import React, { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import Dialog from '@material-ui/core/Dialog'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import TextField from '@material-ui/core/TextField'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import startMultiCapture from 'thunks/jobs/startMultiCapture'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import RemoveIcon from '@material-ui/icons/RemoveCircle'
import { RootState } from 'reducers'
import { extractDeployName } from 'utils'
import defaultArgs, { StreamArgs } from '../defaultStream'
import CameraForm from '../CameraForm'

const useStyles = makeStyles((theme) => ({
  content: {
    display: 'flex',
  },
  list: {
    marginRight: theme.spacing(2),
    paddingRight: theme.spacing(4),
    overflowY: 'auto',
    width: 160,
  },
  listItem: {
    width: 160,
    cursor: 'pointer',
  },
  nameTextField: {
    width: 200,
  },
  formControl: {
    width: 200,
    marginLeft: theme.spacing(1),
  },
}))

type NewMultiDialogProps = {
  handleClose: () => null,
  open: boolean,
  preset: Record<string, unknown>,
}

const NewMultiDialog = (props: NewMultiDialogProps): React.ReactElement => {
  const {
    handleClose,
    open,
    preset,
  } = props

  const classes = useStyles()
  const dispatch = useDispatch()
  const [streams, setStreams] = useState<StreamArgs[]>([])
  const [name, setName] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const deploys = useSelector((state: RootState) => state.deploys)

  const multiCaptures = useMemo(() => (
    Array.from(deploys.values())
      .filter(({ job_script_path: jobScriptPath }) => (
        jobScriptPath.includes('stream_multicapture.py')
      ))
  ), [deploys])

  const streamInstances = useMemo(() => (
    Array.from(deploys.values())
      .filter(({ job_script_path: jobScriptPath }) => (
        jobScriptPath.includes('stream_capture.py')
      ))
  ), [deploys])

  const addStream = () => {
    setStreams(R.append(defaultArgs))
  }

  const args: StreamArgs | null = R.pathOr(null, [selectedId], streams)

  const setArgs = (setter: (args: StreamArgs) => StreamArgs) => {
    setStreams(R.update(selectedId, setter(args)))
  }

  const handleSubmit = () => {
    dispatch(startMultiCapture(streams, name))
    handleClose()
  }

  const remove = (idx) => () => {
    setSelectedId(null)
    setStreams(R.remove(idx, 1))
  }

  // initialize from preset
  useEffect(() => {
    if (preset) {
      setStreams(preset.args)
      setName(preset.name)
    }
  }, [preset])

  const handlePresetSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setSelectedPresetId(e.target.value)
      const streamInstance = deploys.get(Number(e.target.value))

      const tempPreset = JSON.parse(streamInstance.job_script_payload) as StreamArgs
      setStreams(R.update(selectedId)(tempPreset))
    } catch {
      // do nothing
    }
  }

  const nameUsed = useMemo(() => Array.from(
    multiCaptures.values(),
  ).some(({ name: mcName }) => name === mcName), [multiCaptures, name])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
    >
      <DialogContent className={classes.content}>
        <div className={classes.list}>
          <Button
            onClick={addStream}
          >
            add stream
          </Button>
          <List
            style={{ width: 160 }}
          >
            {streams.map((_, idx) => (
              <ListItem
                className={classes.listItem}
                key={idx}
                onClick={() => setSelectedId(idx)}
                selected={idx === selectedId}
              >
                <Typography>
                  {`stream: ${idx}`}
                </Typography>
                <ListItemSecondaryAction>
                  <IconButton onClick={remove(idx)}>
                    <RemoveIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </div>
        <div>
          <div>
            <TextField
              className={classes.nameTextField}
              label="multicapture streamname"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              value={name}
              helperText="Choose unique name."
              error={nameUsed}
            />
            <FormControl
              className={classes.formControl}
              disabled={selectedId === null}
            >
              <InputLabel id="demo-simple-select-label"> prefill from stream-instance</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                onChange={handlePresetSelection}
                value={selectedPresetId !== null ? selectedPresetId : ''}
              >
                <MenuItem value=""> None </MenuItem>
                {streamInstances.map(
                  ({ job_script_payload: jobLoad, id }) => (
                    <MenuItem key={id} value={id}>
                      {extractDeployName(jobLoad)}
                    </MenuItem>
                  ),
                )}

              </Select>
            </FormControl>
          </div>

          {
            (selectedId !== null && args)
            && (
              <CameraForm
                multicapture
                setArgs={setArgs}
                args={args}
              />
            )
          }
        </div>
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={handleClose}>
          close
        </Button>
        <Button
          color="primary"
          onClick={handleSubmit}
          disabled={streams.length === 0 || name === '' || nameUsed}
        >
          submit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NewMultiDialog
