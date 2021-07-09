import React, { useCallback, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core'
import { useThunkDispatch } from 'store'
import Fab from '@material-ui/core/Fab'
import AlertDialog from 'common/AlertDialog'
import ContentContainer from 'common/ContentContainer'
import deleteCamera from 'thunks/cameras/deleteCamera'
import { useSelectedId } from 'utils'
import EmptyFallbackElement from 'common/EmptyFallbackElement'
import InfoMarkdown from 'common/InfoMarkdown'
import EditCameraCard from './EditCameraCard'
import RegionOfInterestCard from './RegionOfInterestCard'
import CalibrateButton from './CalibrateButton'
import LoiCard from './LoiCard'
import StreamInstanceList from './StreamInstanceList'
import CapturedVideosCard from './CapturedVideosCard'

const useStyles = makeStyles(() => ({
  calibrateIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10000,
  },
  newCameraIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10000,
  },
}))

const Editor = (): React.ReactElement => {
  const selectedCameraId = useSelectedId()
  const history = useHistory()

  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const commitDelete = useCallback(() => {
    if (selectedCameraId) {
      dispatch(deleteCamera(selectedCameraId))
        .then((success) => {
          if (success) {
            history.push('/camera')
          }
        })
    }
  }, [dispatch, selectedCameraId, history])

  return (
    <>
      <ContentContainer>
        <EmptyFallbackElement
          isEmpty={!selectedCameraId}
          fallbackElement={<InfoMarkdown file="/markdowns/camera.md" />}
        >
          <>
            <EditCameraCard />
            <RegionOfInterestCard />
            <CalibrateButton />
            <StreamInstanceList />
            <LoiCard />
            <CapturedVideosCard />
            <Fab
              className={classes.newCameraIcon}
              color="secondary"
              variant="extended"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={!selectedCameraId}
            >
              delete
            </Fab>
          </>
        </EmptyFallbackElement>
      </ContentContainer>
      <AlertDialog
        title="Delete camera"
        submitFunction={commitDelete}
        open={deleteDialogOpen}
        handleClose={() => setDeleteDialogOpen(false)}
      />
    </>
  )
}

export default Editor
