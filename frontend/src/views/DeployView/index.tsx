import React, {
  useEffect,
  useMemo,
  memo,
} from 'react'
import { useHistory } from 'react-router-dom'
import { Box, makeStyles } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import getAllCameras from 'thunks/cameras/getAllCameras'
import getDeploys from 'thunks/deploys/getDeploys'
import getDeployByJobId from 'thunks/deploys/getDeployByJobId'
import PageContainer from 'common/PageContainer'
import ContentContainer from 'common/ContentContainer'
import InfoMarkdown from 'common/InfoMarkdown'
import { RootState } from 'reducers'
import { useSelectedId } from 'utils'
import { Deploy } from 'types'
import EmptyFallbackElement from 'common/EmptyFallbackElement'
import Navigator from './Navigator'
import StreamInstanceView from './StreamInstanceView'
import MultiCaptureView from './MultiCaptureView'
import CaptureView from './CaptureView'

const useStyles = makeStyles((theme) => ({
  content: {
    width: '85%',
    padding: theme.spacing(2),
  },
}))

const DeployBody = ({
  deploy,
}: {
  deploy: Deploy | null,
}) => {
  if (deploy === null) {
    return ''
  }
  if (deploy.job_script_path.includes('stream_multicapture.py')) {
    return <MultiCaptureView multiCapture={deploy} />
  }
  if (deploy.job_script_path.includes('stream_capture.py')) {
    return <StreamInstanceView streamInstance={deploy} />
  }
  if (deploy.job_script_path.includes('capture_camera.py')) {
    return <CaptureView capture={deploy} />
  }
  return ''
}

const useDeploy = (id: string | null): Deploy | undefined => {
  const dispatch = useThunkDispatch()
  const deploy = useSelector((state: RootState) => (
    state.deploys.deployCache[Number(id)]))

  React.useEffect(() => {
    if (id) {
      dispatch(getDeployByJobId(Number(id)))
    }
  }, [id, dispatch])

  return deploy
}

const DeployView = () => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const selectedIndex = useSelectedId(['/deploy/:id'])

  useEffect(() => {
    dispatch(getAllCameras())
    dispatch(getDeploys())
  }, [dispatch])

  const deploy = useDeploy(selectedIndex)

  const predictionView = useMemo(() => (
    <EmptyFallbackElement
      isEmpty={deploy === undefined}
      fallbackElement={<InfoMarkdown file="/markdowns/deploy.md" />}
    >
      <DeployBody deploy={deploy} />
    </EmptyFallbackElement>
  ), [deploy])

  return (
    <PageContainer>
      <Navigator
        selectedIndex={Number(selectedIndex)}
      />
      <ContentContainer>
        <Box
          display="flex"
          justifyContent="center"
          width="100%"
        >
          <div className={classes.content}>
            { predictionView }
          </div>
        </Box>
      </ContentContainer>
    </PageContainer>
  )
}

export default memo(DeployView)
