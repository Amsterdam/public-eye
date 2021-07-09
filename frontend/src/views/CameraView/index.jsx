import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import getAllCameras from 'thunks/cameras/getAllCameras'
import PageContainer from 'common/PageContainer'
import Navigator from './Navigator'
import Editor from './Editor'

const CameraView = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getAllCameras())
  }, [dispatch])

  return (
    <PageContainer>
      <Navigator />
      <Editor />
    </PageContainer>
  )
}

export default CameraView
