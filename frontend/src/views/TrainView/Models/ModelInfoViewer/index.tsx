import React from 'react'
import { useThunkDispatch } from 'store'
import { Model } from 'types'
import {
  isEmpty,
} from 'ramda'
import ContentContainer from 'common/ContentContainer'
import { useSelectedId } from 'utils'
import getModelById from 'thunks/training/getModelById'
import InfoMarkdown from 'common/InfoMarkdown'
import EmptyFallbackElement from 'common/EmptyFallbackElement'
import TrainConfig from '../../TrainConfig'
import ScoreCard from '../../ScoreCard'
import ModelAnnotationEditor from './ModelAnnotationEditor'
import ModelTagsEditor from './ModelTagsEditor'

const useModel = (modelId: string | null): Model | undefined => {
  const dispatch = useThunkDispatch()
  const [model, setModel] = React.useState<Model | undefined>(undefined)

  React.useEffect(() => {
    if (modelId) {
      dispatch(getModelById(Number(modelId)))
        .then((result) => {
          if (result) {
            setModel(result)
          }
        })
    }
  }, [modelId, dispatch])

  return model
}

const ModelInfoViewer = (): React.ReactElement => {
  const selectedId = useSelectedId(['/train/models/:id'])
  const selectedModel = useModel(selectedId)

  return (
    <ContentContainer>
      <EmptyFallbackElement
        isEmpty={!selectedModel}
        fallbackElement={<InfoMarkdown file="/markdowns/models.md" />}
      >
        {
          selectedModel
          && (
            <>
              <ModelAnnotationEditor
                modelId={selectedModel.id}
                initialAnnotation={selectedModel.annotation}
              />
              <ModelTagsEditor
                modelId={selectedModel.id}
              />
              {
                selectedModel.train_config_id
                && (
                  <TrainConfig configId={selectedModel.train_config_id} />
                )
              }
              {
                selectedModel.train_run_id
                && (
                  <ScoreCard trainingRunId={selectedModel.train_run_id} />
                )
              }
            </>
          )
        }
      </EmptyFallbackElement>
    </ContentContainer>
  )
}

export default ModelInfoViewer
