import React from 'react'
import {
  last,
  split,
} from 'ramda'
import { useSelector, useDispatch, batch } from 'react-redux'
import setOrAddTrainingRun from 'actions/training/setOrAddTrainingRun'
import setOrAddCachedDeploy from 'actions/deploys/setOrAddCachedDeploy'
import setOrAddJob from 'actions/jobs/setOrAddJob'
import addChartDataRow from 'actions/training/addChartDataRow'
import appendLogData from 'actions/jobs/appendLogData'
import updateTrainingRun from 'actions/training/updateTrainingRun'
import updateCachedTrainingRun from 'actions/training/updateCachedTrainingRun'
import setCachedTrainingRun from 'actions/training/setCachedTrainingRun'
import addTrainingRun from 'actions/training/addTrainingRun'
import updateDeploy from 'actions/deploys/updateDeploy'
import setDeploy from 'actions/deploys/setDeploy'
import addDeploy from 'actions/deploys/addDeploy'
import setInfo from 'actions/general/setInfo'
import deleteJob from 'actions/jobs/deleteJob'
import addDataset from 'actions/datasets/addDataset'
import io from 'socket.io-client'
import { RootState } from 'reducers'
import {
  Job,
  StreamInstance,
  TrainingRun,
  MultiCapture,
  Dataset,
  VideoCapture,
  Deploy,
} from 'types'
import { useMount } from 'react-use'

// When a job ends there is no other way right now to know if it was a training run
// but to parse the path and check if it is one of these strings.
const TRAINING_SCRIPTS = new Set([
  'train_cacc.py',
  'train_garb.py',
  'train_csrnet.py',
  'train_mcnn.py',
  'train_loi_density.py',
  'train_yolo.py',
  'train_vicct.py',
])

const extractScriptPath = (path: string): string | undefined => {
  const splitted = split('/')(path)
  return last(splitted)
}

const isTrainingJob = (path: string): boolean => {
  const scriptName = extractScriptPath(path)
  return Boolean(scriptName && TRAINING_SCRIPTS.has(scriptName))
}

const isDeployJob = (path: string): boolean => {
  const scriptName = extractScriptPath(path)
  return (
    scriptName === 'stream_multicapture.py'
    || scriptName === 'stream_capture.py'
    || scriptName === 'capture_camera.py'
  )
}

export const WebsocketContext = React.createContext<{
  socket: SocketIOClient.Socket | null
}>({ socket: null })

const WebsocketHandler = ({
  children,
}: {
  children: React.ReactNode,
}) => {
  const dispatch = useDispatch()
  const url = useSelector((state: RootState) => state.general.websocketUrl)
  const socket = io(url)

  useMount(() => {
    // eslint-disable-next-line no-console
    socket.on('connect', () => console.log('websocket connected'))
    // eslint-disable-next-line no-console
    socket.on('connect_error', (err: string) => console.error(err))

    const handleJobUpdate = (data: Job) => {
      if (isTrainingJob((data.job_script_path))) {
        batch(() => {
          dispatch(updateTrainingRun(data.id, 'job_status', data.job_status))
          dispatch(updateCachedTrainingRun(data.id, 'job_status', data.job_status))
        })
      }

      if (isDeployJob(data.job_script_path)) {
        dispatch(updateDeploy(data.id, 'job_status', data.job_status))
      }

      dispatch(setOrAddJob(data))
    }

    socket.on('job-log', (msg: { event_type: string, data: { job_id: number, log_data: string } }) => {
      const { event_type: eventType, data } = msg

      switch (eventType) {
        case 'update':
          return dispatch(appendLogData(data.job_id, data.log_data))
        case 'update_error':
          return dispatch(appendLogData(data.job_id, data.log_data))
        default:
          return null
      }
    })

    type ChartDataMessage = {
      event_type: string,
      data: {
        job_id: number,
        row: (number[] | string[]),
      },
    }

    socket.on('chart-data', (msg: ChartDataMessage) => {
      const { event_type: eventType, data } = msg
      const { job_id: jobId, row } = data

      switch (eventType) {
        case 'update':
          return dispatch(addChartDataRow(jobId, row))
        default:
          return null
      }
    })

    type DatasetMessage = {
      event_type: string,
      data: Dataset,
    }

    socket.on('dataset', (msg: DatasetMessage) => {
      const { event_type: eventType, data } = msg

      switch (eventType) {
        case 'new':
          return dispatch(addDataset(data))
        default:
          return null
      }
    })

    type JobMessage = {
      event_type: string,
      data: Job,
    }

    socket.on('job', (msg: JobMessage) => {
      const { event_type: eventType, data } = msg

      switch (eventType) {
        case 'update':
          return handleJobUpdate(data)
        case 'delete':
          return dispatch(deleteJob(data.id))
        default:
          return null
      }
    })

    type VideoCaptureMessage = {
      event_type: string,
      data: VideoCapture,
    }

    socket.on('video-capture', (msg: VideoCaptureMessage) => {
      const { event_type: eventType, data } = msg

      switch (eventType) {
        case 'new':
          return dispatch(addDeploy({ ...data, id: data.running_job_id } as Deploy))
        case 'update':
          return batch(() => {
            dispatch(setOrAddCachedDeploy({ ...data, id: data.running_job_id } as Deploy))
            dispatch(setDeploy({ ...data, id: data.running_job_id } as Deploy))
          })
        default:
          return null
      }
    })

    type StreamInstanceMessage = {
      event_type: string,
      data: StreamInstance,
    }

    socket.on('stream-instance', (msg: StreamInstanceMessage) => {
      const { event_type: eventType, data } = msg

      switch (eventType) {
        case 'new':
          return dispatch(addDeploy({ ...data, id: data.running_job_id } as unknown as Deploy))
        case 'update':
          return batch(() => {
            dispatch(
              setOrAddCachedDeploy({ ...data, id: data.running_job_id } as unknown as Deploy),
            )
            dispatch(
              setDeploy({ ...data, id: data.running_job_id } as unknown as Deploy),
            )
          })
        default:
          return null
      }
    })

    type TrainingRunMessage = {
      event_type: string,
      data: TrainingRun,
    }

    socket.on('training-run', (msg: TrainingRunMessage) => {
      const { event_type: eventType, data } = msg

      switch (eventType) {
        case 'new':
          return dispatch(addTrainingRun(data))
        case 'update':
          batch(() => {
            dispatch(setOrAddTrainingRun(data))
            dispatch(setCachedTrainingRun(data))
          })
          return null
        default:
          return null
      }
    })

    type MultiCaptureMessage = {
      event_type: string,
      data: MultiCapture,
    }

    socket.on('multi-capture', (msg: MultiCaptureMessage) => {
      const { event_type: eventType, data } = msg

      switch (eventType) {
        case 'new':
          return dispatch(addDeploy({ ...data, id: data.running_job_id } as unknown as Deploy))
        case 'update':
          return batch(() => {
            dispatch(
              setOrAddCachedDeploy({ ...data, id: data.running_job_id } as unknown as Deploy),
            )
            dispatch(setDeploy({ ...data, id: data.running_job_id } as unknown as Deploy))
          })
        default:
          return null
      }
    })

    type InfoMessage = {
      event_type: string,
      data: {
        message: string,
      }
    }

    socket.on('info', (msg: InfoMessage) => {
      const { event_type: eventType, data } = msg

      switch (eventType) {
        case 'new':
          return dispatch(setInfo(true, data.message))
        default:
          return null
      }
    })
  })

  return (
    <WebsocketContext.Provider
      // eslint-disable-next-line
      value={{ socket }}
    >
      {children}
    </WebsocketContext.Provider>
  )
}

export default React.memo(WebsocketHandler)
