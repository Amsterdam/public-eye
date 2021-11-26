import React, {
  useState, useEffect, useReducer, useCallback,
} from 'react'
import * as R from 'ramda'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import IconButton from '@material-ui/core/IconButton'
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Button from '@material-ui/core/Button'
import RegionOfInterest from 'common/RegionOfInterest'
import submitRoi from 'thunks/cameras/submitRoi'
import getRois from 'thunks/cameras/getRois'
import captureStream from 'thunks/cameras/captureStream'
import getStreamCaptureByCameraId from 'thunks/cameras/getStreamCaptureByCameraId'
import deleteRoi from 'thunks/cameras/deleteRoi'
import AlertDialog from 'common/AlertDialog'
import { useSelectedId } from 'utils'
import { StreamRoi } from 'types'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  textField: {
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(2),
  },
  cardActions: {
    display: 'flex',
    flexDirection: 'row-reverse',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
  },
  roiContainer: {
    padding: theme.spacing(1),
  },
  formControl: {
    minWidth: 300,
    paddingBottom: theme.spacing(1),
  },
}))

type State = {
  rois: Map<string, StreamRoi>,
  selectedRoi: StreamRoi | null,
}

const initialState: State = {
  rois: new Map<string, StreamRoi>(),
  selectedRoi: null,
}

type SetAllAction = {
  type: 'SET_ALL',
  rois: StreamRoi[],
}

const setAllAction = (state: State, action: SetAllAction) => {
  const newRois = new Map()
  action.rois.forEach((roi: StreamRoi) => {
    newRois.set(roi.id, roi)
  })
  return {
    ...state,
    rois: newRois,
  }
}

type SetSelectedRoiAction = {
  roi: StreamRoi,
  type: 'SET_SELECTED_ROI',
}

type DeleteAction = {
  type: 'DELETE',
  id: number,
}

type SetOrAddAction = {
  type: 'SET_OR_ADD',
  roi: StreamRoi,
}

type ReducerAction = (
  SetAllAction
  | SetSelectedRoiAction
  | DeleteAction
  | SetOrAddAction
)

const reducer = (state: State, action: ReducerAction) => {
  switch (action.type) {
    case 'SET_SELECTED_ROI':
      return {
        ...state,
        selectedRoi: action.roi,
      }
    case 'SET_ALL':
      return setAllAction(state, action)
    case 'SET_OR_ADD':
      return {
        selectedRoi: action.roi,
        // @ts-ignore
        rois: new Map(state.rois.set(action.roi.id, action.roi)),
      }
    case 'DELETE':
      // @ts-ignore
      state.rois.delete(action.id)

      return {
        ...state,
        rois: new Map(state.rois),
      }
    default:
      throw new Error();
  }
}

const RegionOfInterestCard = (): React.ReactElement => {
  // @ts-ignore
  const cameraId = useSelectedId()
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [areaPoints, setAreaPoints] = useState([])
  const [name, setName] = useState('')
  const [streamCapture, setStreamCapture] = useState(null)
  const [state, dispatchRoi] = useReducer(reducer, initialState)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const setSelectedRoi = (roi: StreamRoi) => {
    if (roi !== null) {
      setName('')
    }
    dispatchRoi({ type: 'SET_SELECTED_ROI', roi })
  }

  const { selectedRoi } = state
  const { rois } = state

  useEffect(() => {
    if (!cameraId) {
      return
    }
    // @ts-ignore
    dispatch(getRois(cameraId))
      .then((result) => {
        // @ts-ignore
        dispatchRoi({ type: 'SET_ALL', rois: result })
      })
  }, [cameraId, dispatch])

  const submitFunction = useCallback(() => {
    if (streamCapture) {
      // @ts-ignore
      dispatch(submitRoi(cameraId, areaPoints, name))
        .then((result) => {
          // @ts-ignore
          dispatchRoi(({ type: 'SET_OR_ADD', roi: result }))
          setName('')
        })
    }
  }, [areaPoints, dispatch, cameraId, name, streamCapture])

  const commitCapture = useCallback(async () => {
    // @ts-ignore
    const res = await dispatch(captureStream(cameraId))

    if (res) {
      // @ts-ignore
      setStreamCapture(res)
    }
  }, [dispatch, cameraId])

  useEffect(() => {
    setAreaPoints([])
    // @ts-ignore
    setSelectedRoi(null)
    if (!cameraId) {
      return
    }
    // @ts-ignore
    dispatch(getStreamCaptureByCameraId(cameraId))
      .then((result) => {
        if (result) {
          // @ts-ignore
          setStreamCapture(result)
        } else {
          setStreamCapture(null)
        }
      })
  }, [cameraId, dispatch])

  const commitDelete = useCallback(() => {
    if (selectedRoi && selectedRoi.id) {
      // @ts-ignore
      dispatch(deleteRoi(cameraId, selectedRoi.id))
        .then(() => {
          // @ts-ignore
          setSelectedRoi(null)
          setAreaPoints([])
          dispatchRoi(({ type: 'DELETE', id: selectedRoi.id }))
        })
    }
  }, [cameraId, dispatch, selectedRoi])

  return (
    <>
      <div className={classes.root}>
        <Card>
          <CardHeader
            title="Region of interest"
            action={(
              <IconButton
                onClick={commitCapture}
              >
                <PhotoCameraIcon />
              </IconButton>
            )}
          />
          <CardContent>
            <div className={classes.row}>
              <TextField
                label="Name"
                value={name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  // @ts-ignore
                  setSelectedRoi(null)
                  setName(e.target.value)
                }}
                className={classes.textField}
              />
              <FormControl className={classes.formControl}>
                <InputLabel id="demo-simple-select-label">selected region of interest</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={selectedRoi || ''}
                  // @ts-ignore
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    // @ts-ignore
                    setSelectedRoi(e.target.value)
                  }}
                >
                  {Array.from(rois.values()).map((roi: StreamRoi) => (
                    <MenuItem
                      key={roi.id}
                      // @ts-ignore
                      value={roi}
                    >
                      {roi.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <RegionOfInterest
              // @ts-ignore
              streamCapture={streamCapture}
              // @ts-ignore
              areaPoints={selectedRoi ? selectedRoi.polygons : areaPoints}
              // @ts-ignore
              setAreaPoints={setAreaPoints}
            />
          </CardContent>
          <CardActions className={classes.cardActions}>
            {
              selectedRoi === null
                ? (
                  <Button
                    color="primary"
                    onClick={submitFunction}
                    disabled={R.equals(areaPoints, []) || name === ''}
                  >
                    submit
                  </Button>
                ) : (
                  <Button
                    color="secondary"
                    disabled={selectedRoi === null}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    delete
                  </Button>
                )
            }
          </CardActions>
        </Card>
      </div>
      <AlertDialog
        title="Delete region of interest"
        submitFunction={commitDelete}
        handleClose={() => setDeleteDialogOpen(false)}
        open={deleteDialogOpen && selectedRoi !== null}
      />
    </>
  )
}

export default RegionOfInterestCard
