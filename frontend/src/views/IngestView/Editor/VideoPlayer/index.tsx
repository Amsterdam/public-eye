import React, {
  useCallback,
  useRef,
  useState,
  useMemo,
} from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import IconButton from '@material-ui/core/IconButton'
import Button from '@material-ui/core/Button'
import PlayArrow from '@material-ui/icons/PlayArrow'
import Pause from '@material-ui/icons/Pause'
import SkipPrevious from '@material-ui/icons/SkipPrevious'
import SkipNext from '@material-ui/icons/SkipNext'
import DeleteIcon from '@material-ui/icons/Delete'
import Paper from '@material-ui/core/Paper'
import captureFrame from 'thunks/frames/captureFrame'
import deleteVideo from 'thunks/staticFiles/deleteVideo'
import updateVideo from 'thunks/staticFiles/updateVideo'
import RenameDialog from 'common/RenameDialog'
import { getToken } from 'utils'
import { RootState } from 'reducers'

const WIDTH = 800

const useStyles = makeStyles((theme) => ({
  editorContainer: {
    width: WIDTH,
  },
  editor: {
    width: WIDTH,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    display: 'flex',
    padding: theme.spacing(1),
    justifyContent: 'space-between',
  },
  captureButton: {
    margin: theme.spacing(1),
  },
  title: {
    margin: theme.spacing(2),
    marginBottom: theme.spacing(10),
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
  },
}))

const fps = 24
const stepsize = 1.0 / fps

const VideoPlayer = ({
  id,
}: {
  id: string | number,
}): React.ReactElement => {
  const history = useHistory()
  const ref = useRef<HTMLVideoElement>(null)
  const dispatch = useThunkDispatch()
  const [playing, setPlaying] = useState(false)
  const classes = useStyles()
  const baseUrl = useSelector((state: RootState) => state.general.baseUrl)
  const token = getToken()

  const [renameDialogOpen, setRenameDialogOpen] = useState(false)

  const renameFunction = useCallback((value) => {
    dispatch(updateVideo(id, value))
  }, [dispatch, id])

  const setTime = useCallback((stepSize: number) => {
    if (ref.current === null || ref.current.currentTime === null) {
      return
    }
    ref.current.currentTime = String(Number(ref.current.currentTime) + stepSize)
  }, [])

  const next = useCallback(() => {
    setTime(stepsize)
  }, [setTime])

  const back = useCallback(() => {
    setTime(-stepsize)
  }, [setTime])

  const play = useCallback(() => {
    if (!ref.current) return
    if (typeof ref.current.play === 'function') {
      (ref.current.play as () => void)()
    }
  }, [])

  const pause = useCallback(() => {
    if (!ref.current) return
    (ref.current.pause as () => void)()
  }, [])

  const pausePlay = useMemo(() => (
    playing
      ? (
        <IconButton onClick={pause}>
          <Pause />
        </IconButton>
      ) : (
        <IconButton onClick={play}>
          <PlayArrow />
        </IconButton>
      )
  ), [pause, play, playing])

  const url = useMemo(() => (
    `${baseUrl}/files/videos/${id}?tk=${token}`
  ), [baseUrl, id, token])

  const capture = useCallback(() => {
    // hours seems to start at 01...
    if (ref.current && ref.current.currentTime) {
      const timestamp = ref.current.currentTime

      dispatch(captureFrame(id, timestamp))
    }
  }, [id, dispatch])

  const commitDelete = useCallback(() => {
    dispatch(deleteVideo(id))
      .then((success) => {
        if (success) {
          history.push('/ingest/videos')
        }
      })
  }, [id, dispatch, history])

  return (
    <>
      <Paper>
        <div className={classes.editorContainer}>
          <div className={classes.editor}>
            <video
              key={url}
              onPause={() => setPlaying(false)}
              onPlay={() => setPlaying(true)}
              ref={ref}
              width={WIDTH}
              controls
            >
              <track />
              <source src={url} />
              Your browser does not support HTML5 video.
            </video>
          </div>
          <div className={classes.actionRow}>
            <div>
              <Button
                className={classes.captureButton}
                color="primary"
                variant="contained"
                onClick={capture}
              >
                capture
              </Button>
              <Button
                className={classes.captureButton}
                color="primary"
                variant="contained"
                onClick={() => setRenameDialogOpen(true)}
              >
                rename
              </Button>
              <Button
                className={classes.captureButton}
                variant="contained"
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={commitDelete}
              >
                delete video
              </Button>
            </div>
            <div>
              <IconButton onClick={back}>
                <SkipPrevious />
              </IconButton>
              {pausePlay}
              <IconButton onClick={next}>
                <SkipNext />
              </IconButton>
            </div>
          </div>
        </div>
      </Paper>
      <RenameDialog
        open={renameDialogOpen}
        title="Rename video"
        renameFunction={renameFunction}
        handleClose={() => setRenameDialogOpen(false)}
      />
    </>
  )
}

export default VideoPlayer
