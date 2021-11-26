import React from 'react'
import { useThunkDispatch } from 'store'
import PageContainer from 'common/PageContainer'
import { useMount } from 'react-use'
import getAllModels from 'thunks/training/getAllModels'
import getModelTags from 'thunks/training/getModelTags'
import ModelInfoViewer from './ModelInfoViewer'
import ModelNavigator from './ModelNavigator'

const Models = (): JSX.Element => {
  const dispatch = useThunkDispatch()

  useMount(() => {
    dispatch(getAllModels())
    dispatch(getModelTags())
  })

  return (
    <PageContainer>
      <ModelNavigator />
      <ModelInfoViewer />
    </PageContainer>
  )
}

export default Models
