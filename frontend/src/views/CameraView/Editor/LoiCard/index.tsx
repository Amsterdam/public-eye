// @ts-nocheck
import React, {
  useState, useEffect, useReducer, useCallback,
} from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core/styles'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardHeader from '@material-ui/core/CardHeader'
import { useThunkDispatch } from 'store'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import IconButton from '@material-ui/core/IconButton'
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera'
import LineOfInterest from 'common/LineOfInterest'
import getStreamCaptureByCameraId from 'thunks/cameras/getStreamCaptureByCameraId'
import submitLoi from 'thunks/cameras/submitLoi'
import captureStream from 'thunks/cameras/captureStream'
import getLois from 'thunks/cameras/getLois'
import deleteLoi from 'thunks/cameras/deleteLoi'
import { CardContent } from '@material-ui/core'
import AlertDialog from 'common/AlertDialog'
import { StreamCapture, StreamLoi } from 'types'
import { useSelectedId } from 'utils'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    minWidth: 300,
  },
  textField: {
    marginBottom: theme.spacing(1),
    marginRight: theme.spacing(2),
  },
  textFieldContainer: {
    marginRight: theme.spacing(4),
  },
  loiContainer: {
    // padding: theme.spacing(2),
  },
  actions: {
    display: 'flex',
    flexDirection: 'row-reverse',
  },
  formControl: {
    minWidth: 300,
  },
}))

type State = {
  lois: Map<number, StreamLoi>,
  selectedLoi: StreamLoi | null,
}

const initialState: State = {
  lois: new Map<number, StreamLoi>(),
  selectedLoi: null,
}

type SetAllAction = {
  type: 'SET_ALL',
  lois: StreamLoi[],
}

const setAllAction = (
  state: State,
  action: SetAllAction,
): State => {
  const newLois = new Map<number, StreamLoi>()
  action.lois.forEach((loi: StreamLoi) => {
    newLois.set(loi.id, loi)
  })
  return {
    ...state,
    lois: newLois,
  }
}

type SetSelectedLoiAction = {
  type: 'SET_SELECTED_LOI',
  loi: StreamLoi,
}

type SetOrAddAction = {
  type: 'SET_OR_ADD',
  loi: StreamLoi,
}

type DeleteAction = {
  type: 'DELETE',
  id: number,
}

type ReducerAction = (
  SetAllAction
  | SetSelectedLoiAction
  | SetOrAddAction
  | DeleteAction
  | DeleteAction
)

const reducer = (state: State, action: ReducerAction): State => {
  switch (action.type) {
    case 'SET_SELECTED_LOI':
      return {
        ...state,
        selectedLoi: action.loi,
      }
    case 'SET_ALL':
      return setAllAction(state, action)
    case 'SET_OR_ADD':
      return {
        selectedLoi: action.loi,
        lois: new Map(
          state.lois.set(
            action.loi.id,
            action.loi,
          ),
        ),
      }
    case 'DELETE':
      state.lois.delete(action.id)

      return {
        ...state,
        lois: new Map(state.lois),
      }
    default:
      throw new Error();
  }
}

const LoiCard = (): React.ReactElement => {
  const cameraId = useSelectedId()
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [areaPoints, setAreaPoints] = useState<never[][]>([])
  const [name, setName] = useState('')
  const [streamCapture, setStreamCapture] = useState<StreamCapture | null>(null)
  const [state, dispatchLoi] = useReducer(reducer, initialState)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const setSelectedLoi = (loi: StreamLoi | null) => {
    if (loi === null) {
      return
    }

    setName('')
    dispatchLoi({ type: 'SET_SELECTED_LOI', loi })
  }

  useEffect(() => {
    if (!cameraId) {
      return
    }
    dispatch(getLois(Number(cameraId)))
      .then((result) => {
        dispatchLoi({ type: 'SET_ALL', lois: result as StreamLoi[] })
      })
  }, [cameraId, dispatch])

  const submitFunction = useCallback(() => {
    // @ts-ignore
    dispatch(submitLoi(Number(cameraId), areaPoints, name))
      .then((result) => {
        dispatchLoi(({ type: 'SET_OR_ADD', loi: result as StreamLoi }))
        setName('')
      })
  }, [areaPoints, cameraId, dispatch, name])

  const commitCapture = useCallback(async () => {
    const res = await dispatch(captureStream(Number(cameraId)))

    if (res) {
      setStreamCapture(res as StreamCapture)
    }
  }, [dispatch, cameraId])

  useEffect(() => {
    setAreaPoints([])
    setSelectedLoi(null)
    if (!cameraId) {
      return
    }
    dispatch(getStreamCaptureByCameraId(Number(cameraId)))
      .then((result) => {
        if (result) {
          setStreamCapture(result as StreamCapture)
        } else {
          setStreamCapture(null)
        }
      })
  }, [dispatch, cameraId])

  const commitDelete = useCallback(() => {
    if (state.selectedLoi && state.selectedLoi.id) {
      dispatch(deleteLoi(Number(cameraId), state.selectedLoi.id))
        .then(() => {
          setSelectedLoi(null)
          setAreaPoints([])
          dispatchLoi(({ type: 'DELETE', id: Number(state?.selectedLoi?.id) }))
        })
    }
  }, [cameraId, dispatch, state.selectedLoi])

  return (
    <>
      <div className={classes.root}>
        <Card>
          <CardHeader
            title="Line of interest"
            action={(
              <IconButton
                onClick={commitCapture}
              >
                <PhotoCameraIcon />
              </IconButton>
            )}
          />
          <CardContent>
            <div>
              <TextField
                label="Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSelectedLoi(null)
                }}
                className={classes.textField}
              />
              <FormControl className={classes.formControl}>
                <InputLabel>selected line of interest</InputLabel>
                <Select
                  value={state.selectedLoi || ''}
                  // @ts-ignore
                  onChange={(e: React.ChangeEvent<{ value: string }>) => (
                    // @ts-ignore
                    setSelectedLoi(e.target.value)
                  )}
                >
                  {Array.from(state.lois.values()).map((loi) => (
                    <MenuItem
                      key={loi.id}
                      // @ts-ignore
                      value={loi}
                    >
                      {loi.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div className={classes.loiContainer}>
              {
                streamCapture
                && (
                  <LineOfInterest
                    streamCapture={streamCapture}
                    // @ts-ignore
                    areaPoints={state.selectedLoi ? state.selectedLoi.polygons : areaPoints}
                    setAreaPoints={setAreaPoints}
                  />
                )

              }

            </div>
          </CardContent>
          <CardActions
            className={classes.actions}
          >
            {
              state.selectedLoi === null
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
        title="Delete line of interest"
        submitFunction={commitDelete}
        handleClose={() => setDeleteDialogOpen(false)}
        open={deleteDialogOpen && state.selectedLoi !== null}
      />
    </>
  )
}

export default LoiCard
