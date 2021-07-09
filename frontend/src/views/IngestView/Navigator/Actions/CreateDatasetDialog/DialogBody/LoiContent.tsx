import React, { useCallback, useState, memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import FormHelperText from '@material-ui/core/FormHelperText'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Switch from '@material-ui/core/Switch'
import {
  Box,
  Typography,
} from '@material-ui/core'
import createDatasetFromStreamCollection from 'thunks/jobs/createLoiDatasetFromStreamCollection'
import createDatasetFromVideoCollection from 'thunks/jobs/createLoiDatasetFromVideoCollection'
import createDataset from 'thunks/jobs/createLoiDataset'
import { path } from 'ramda'
import { RootState } from 'reducers'
import { Video, Collection } from 'types'
import { useSelectedId } from 'utils'

type LoiContentProps = {
  selectedFrameIds: number[],
  handleClose: () => null,
}

const useStyles = makeStyles((theme) => ({
  content: {
    width: 350,
  },
  textField: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    width: 250,
  },
}))

const ActionRow = ({
  handleClose,
  disabled,
  onCreateDataset,
}: {
  handleClose: () => void,
  disabled: boolean,
  onCreateDataset: () => void
}) => (
  <DialogActions>
    <Button
      color="primary"
      onClick={handleClose}
    >
      cancel
    </Button>
    <Button
      color="primary"
      disabled={disabled}
      onClick={onCreateDataset}
    >
      process
    </Button>
  </DialogActions>
)

const LoiStreamCollection = ({
  datasetName,
  handleClose,
  collectionId,
}: {
  datasetName: string,
  collectionId: number | undefined,
  handleClose: () => void,
}) => {
  const classes = useStyles()
  const dispatch = useDispatch()
  const [distance, setDistance] = useState('')
  const [skipBetween, setSkipBetween] = useState(false)

  const onCreateDataset = useCallback(() => {
    const scriptArgs = {
      dataset_name: datasetName,
      collection_id: collectionId,
      skip_between: skipBetween,
      distance,
    }
    dispatch(createDatasetFromStreamCollection(scriptArgs))

    handleClose()
  }, [datasetName, dispatch, distance, handleClose, collectionId,
    skipBetween])

  return (
    <>
      <div>
        <TextField
          label="Distance"
          value={distance}
          onChange={(e) => {
            setDistance(e.target.value)
          }}
          className={classes.textField}
        />
        <div>
          <FormControlLabel
            control={(
              <Switch
                checked={skipBetween}
                onChange={(e) => setSkipBetween(e.target.checked)}
                name="skip-between"
              />
            )}
            label="Skip between"
          />
        </div>
        <FormHelperText>
          The distance supplied is the distance in frames between the input and target.
          Skip between entails whether the frames in between the input and target are
          used.
        </FormHelperText>
      </div>
      <ActionRow
        handleClose={handleClose}
        disabled={datasetName === '' || distance === ''}
        onCreateDataset={onCreateDataset}
      />
    </>
  )
}

const LoiVideo = ({
  datasetName,
  handleClose,
  selectedFrameIds,
}: {
  datasetName: string,
  handleClose: () => void,
  selectedFrameIds: number[],
}) => {
  const classes = useStyles()
  const dispatch = useDispatch()
  const selectedId = useSelectedId()
  const [delta, setDelta] = useState('')

  const onCreateDataset = useCallback(() => {
    if (selectedFrameIds.length === 0 && selectedId) {
      const scriptArgs = {
        dataset_name: datasetName,
        collection_id: selectedId,
        ss_delta_next_frame: delta,
      }
      dispatch(createDatasetFromVideoCollection(scriptArgs))
    } else {
      const scriptArgs = {
        dataset_name: datasetName,
        ss_delta_next_frame: delta,
        frames: selectedFrameIds,
      }
      dispatch(createDataset(scriptArgs))
    }
    handleClose()
  }, [datasetName, selectedFrameIds, delta, dispatch, handleClose, selectedId])

  return (
    <>
      <div>
        <TextField
          label="Delta"
          value={delta}
          onChange={(e) => {
            setDelta(e.target.value)
          }}
          className={classes.textField}
        />
        <FormHelperText>
          Supply a delta here if the collection contains frames captured from a video.
          If you want the next frame to occur 100ms after each frame supply a value of 0.1.
        </FormHelperText>
      </div>
      <ActionRow
        onCreateDataset={onCreateDataset}
        handleClose={handleClose}
        disabled={datasetName === '' || delta === ''}
      />
    </>
  )
}

const LoiContent = (props: LoiContentProps) => {
  const {
    selectedFrameIds,
    handleClose,
  } = props

  const classes = useStyles()
  const selectedId = useSelectedId()
  const [datasetName, setDatasetName] = useState('')
  const [streamOrVideo, setStreamOrVideo] = useState(false)

  const changeTextField = (changeFunction: React.Dispatch<React.SetStateAction<string>>) => (
    (e: React.ChangeEvent<HTMLInputElement>) => changeFunction(e.target.value)
  )
  return (
    <>
      <DialogContent>
        <Box display="flex" justifyContent="space-between">
          <TextField
            label="Dataset Name"
            onChange={changeTextField(setDatasetName)}
            className={classes.textField}
            value={datasetName}
          />
          {
            selectedFrameIds.length === 0
            && (
              <Box display="flex" alignItems="center" padding={1}>
                <Typography style={{ paddingRight: 12 }}>
                  video collection
                </Typography>
                <FormControlLabel
                  control={(
                    <Switch
                      checked={streamOrVideo}
                      onChange={(e) => setStreamOrVideo(e.target.checked)}
                      name="stream"
                    />
                  )}
                  label="stream collection"
                />
              </Box>
            )
          }
        </Box>
        {
          streamOrVideo
            ? (
              <LoiStreamCollection
                handleClose={handleClose}
                datasetName={datasetName}
                collectionId={Number(selectedId)}
              />
            ) : (
              <LoiVideo
                datasetName={datasetName}
                handleClose={handleClose}
                selectedFrameIds={selectedFrameIds}
              />
            )
        }
      </DialogContent>
    </>
  )
}

export default memo(LoiContent)
