import React from 'react'
import * as R from 'ramda'
import { useThunkDispatch } from 'store'
import JsonViewer from 'common/JsonViewer'
import getTrainingConfig from 'thunks/training/getTrainingConfig'

const TrainConfig = ({
  configId,
}: {
  configId: number | undefined,
}) => {
  const dispatch = useThunkDispatch()
  const [config, setConfig] = React.useState('')

  React.useEffect(() => {
    if (configId) {
      dispatch(getTrainingConfig(configId)).then(setConfig)
    } else {
      setConfig('')
    }
  }, [configId, dispatch])

  return (
    <JsonViewer
      title="Train Config"
      json={JSON.stringify(config)}
    />
  )
}

export default React.memo(TrainConfig)
