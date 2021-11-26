import { Express } from 'express'
import UserRoute from 'api/UserRoute'
import StaticFilesRoute from 'api/StaticFilesRoute'
import FramesRoute from 'api/FramesRoute'
import JobsRoute from 'api/JobsRoute'
import CollectionsRoute from 'api/CollectionsRoute'
import DatasetsRoute from 'api/DatasetsRoute'
import TrainingRunsRoute from 'api/TrainingRunsRoute'
import NeuralNetworkRoute from 'api/NeuralNetworkRoute'
import StreamInstanceRoute from 'api/StreamInstanceRoute'
import StreamCaptureRoute from 'api/StreamCaptureRoute'
import GpuRoute from 'api/GpuRoute'
import WebsocketRoute from 'api/WebsocketRoute'
import DebugRoute from 'api/DebugRoute'
import MultiCaptureRoute from 'api/MultiCaptureRoute'
import CameraRoute from 'api/CameraRoute'
import DeployRoute from 'api/DeployRoute'
import { Dependencies } from 'common/dependencies'

const api = (app: Express, deps: Dependencies): void => {
  console.log('mount routes with deps', deps)

  app.use('/users', UserRoute(deps))
  app.use('/files', StaticFilesRoute(deps))
  app.use('/frames', FramesRoute(deps))
  app.use('/jobs', JobsRoute(deps))
  app.use('/collections', CollectionsRoute(deps))
  app.use('/datasets', DatasetsRoute(deps))
  app.use('/training_runs', TrainingRunsRoute(deps))
  app.use('/neural_networks', NeuralNetworkRoute(deps))
  app.use('/stream_instance', StreamInstanceRoute(deps))
  app.use('/stream_capture', StreamCaptureRoute(deps))
  app.use('/gpu', GpuRoute(deps))
  app.use('/websocket', WebsocketRoute(deps))
  app.use('/debug', DebugRoute(deps))
  app.use('/multicapture_stream', MultiCaptureRoute(deps))
  app.use('/cameras', CameraRoute(deps))
  app.use('/deploys', DeployRoute(deps))
}

export default api
