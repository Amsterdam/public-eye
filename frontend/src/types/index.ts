export type VoidFunction = () => void

export type ChartDataRow = (number | string)[]

export type UserRole = { id: number, name: string }

/* database types */
export type VideoCapture = {
  output_stream_path: string,
  running_job_id: number,
}

export type Collection = {
  collection_id: number,
  frame_count: string,
  frame_locked_count: string,
  id: number,
  name: string,
}

export type ObjectLabel = {
  id: number,
  name: string,
  rgb: string,
}

export type Video = {
  frame_count: string,
  frame_locked_count: string,
  id: number,
  path: string,
  video_file_id: number,
}

export type User = {
  id: number,
  email: string,
  roles: UserRole[],
}

export type TrainingRun = {
  id: number,
  config_id: number,
  job_id: number,
  job_status: string,
  model_name: string,
  train_script: string,
  job_script_payload: string,
  nn_type: string,
}

export type Score = {
  id: number,
  score_name: string,
  score_value: number,
  training_run_id: number,
}

export type ModelTag = {
  id: number,
  name: string,
}

export type ModelTagLink = {
  id: number,
  model_id: number,
  model_tag_id: number,
}

export type Model = {
  id: number,
  annotation: string,
  scores: Score[],
  name: string,
  tags: ModelTag[],
  train_config_id?: number,
  train_run_id?: number,
}

export type Job = {
  id: number,
  job_script_payload: string,
  job_script_path: string,
  job_status: string,
}

// x, y coordinate in the frame
export type FrameTag = {
  id: number,
  x: number,
  y: number,
  frame_id: number,
}

export type Frame = {
  id: number,
  ts_vid?: number | undefined,
  ts_utc?: number | undefined,
  locked: boolean,
  path: string,
  type?: string | undefined,
  item_id?: number | undefined,
  video_file_id?: number | undefined,
}

export type Camera = {
  id: number,
  stream_url: string,
  name: string,
  supplier: string,
  geo_long: string,
  geo_lat: string,
  azimuth: string,
  fps: string,
  area_size_m2?: number | string,
}

export type MultiCapture = {
  id: number,
  job_status: string,
  running_job_id: number,
  name: string,
}

export type NeuralNetwork = {
  id: number,
  train_script: string,
  name: string,
  nn_type: string,
}

export type Dataset = {
  id: number,
  nn_type: string,
  name: string,
  frame_count: string,
}

export type BoundingBox = {
  x: number,
  y: number,
  w: number,
  h: number,
  rgb: string,
  bb_id: number,
}

export type StreamInstance = {
  camera_id: number,
  creation_date: string,
  err_log_path: string,
  id: number,
  job_script_path: string,
  job_script_payload: string,
  job_status: string,
  log_path: string,
  model_id: number,
  name: string,
  neural_network_id: number,
  output_stream_path: string | null,
  pid: number,
  running_job_id: number,
  multicapture: boolean,
}

export type StreamCapture = {
  id: number,
  capture_path: string,
  camera_id: number,
}

export type LoiPolygon = [[number, number], [number, number]][]

export type StreamLoi = {
  id: number,
  name: number,
  camera_id: number,
  polygons: LoiPolygon,
}

export type RoiPolygon = [
  [number, number],
  [number, number],
  [number, number],
  [number, number]][]

export type StreamRoi = {
  id: number,
  name: number,
  camera_id: number,
  polygons: RoiPolygon,
}

export type Deploy = {
  id: number,
  job_script_path: string,
  job_script_payload: string
  creation_date: string,
  job_status: 'error' | 'done' | 'running',
  log_path: string,
  err_log_path: string,
  pid: number,
  created_by_user_id: number,
  name: string | null,
  model_id: number | null,
  neural_network_id: number | null,
  running_job_id: number,
  output_stream_path: string | null,
  camera_id: number | null,
}
