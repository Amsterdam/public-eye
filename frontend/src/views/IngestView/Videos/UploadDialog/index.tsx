// @ts-nocheck
import React from 'react'
import { batch } from 'react-redux'
import uuid from 'uuid'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  LinearProgress,
  Button,
  makeStyles,
  Box,
} from '@material-ui/core'
import {
  Add as AddIcon,
} from '@material-ui/icons'
import FileInputButton from 'common/FileInputButton'
import setInfo from 'actions/general/setInfo'
import addVideo from 'actions/ingest/addVideo'
import { useThunkDispatch } from 'store'
import { Video } from 'types'
import { useUnmount } from 'react-use'
import { WebsocketContext } from 'common/WebsocketHandler'

const useStyles = makeStyles(() => ({
  root: {
    width: 400,
  },
}))

const UploadDialog = (): JSX.Element => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [open, setOpen] = React.useState(false)
  const [uploadId, setUploadId] = React.useState<null | string>(null)
  const [progress, setProgress] = React.useState<null | number>(null)
  const { socket } = React.useContext(WebsocketContext)

  const readAllChunks = React.useCallback(async (
    id: string,
    readableStream: ReadableStream,
    fileSize: number,
  ) => {
    const reader = readableStream.getReader()

    let bytesDone = 0
    let done = false
    let value
    while (!done) {
      // eslint-disable-next-line
      ({ value, done } = await reader.read() as { value: Uint8Array, done: boolean })

      // eslint-disable-next-line
      socket.emit(`${id}-chunk`, { value, done }, (bytes: number) => {
        try {
          bytesDone += bytes

          setProgress((oldProgress) => (
            oldProgress !== null && oldProgress !== 100
              ? Math.ceil(100 * (bytesDone / fileSize))
              : oldProgress
          ))
        } catch (err) {
          // eslint-disable-next-line
          console.error(err)
        }
      })
    }

    return true
  }, [socket])

  React.useEffect(() => {
    if (uploadId) {
      socket.on(`${String(uploadId)}-done`, (videoFile: Video) => {
        batch(() => {
          dispatch(setInfo(true, 'File uploaded'))
          dispatch(addVideo(videoFile))
          setTimeout(() => setOpen(false), 700)
        })
        setProgress(100)
      })
    }
  }, [uploadId, dispatch, socket])

  const startUploadCallback = React.useCallback(
    (id: string, e: React.ChangeEvent<HTMLInputElement>) => (status: string) => {
      if (status === 'file-exists') {
        dispatch(setInfo(true, 'Video with that name already exists', 'error'))
      }
      if (status === 'open') {
        setProgress(0)
        // eslint-disable-next-line
        readAllChunks(id, e.target.files[0].stream(), e.target.files[0].size)
      }
    }, [dispatch, readAllChunks],
  )

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // eslint-disable-next-line
    const id = uuid.v4() as string
    setUploadId(id)
    socket.emit(
      'start-upload-video',
      {
        id,
        // eslint-disable-next-line
        name: e.target.files[0].name,
      },
      startUploadCallback(id, e),
    )
  }, [socket, startUploadCallback])

  const onClose = React.useCallback(() => {
    socket.emit(`${String(uploadId)}-abort`, (aborted: boolean) => {
      if (aborted) {
        dispatch(setInfo(true, 'Upload aborted', 'error'))
      }
    })
    setOpen(false)
  }, [uploadId, socket, dispatch])

  useUnmount(() => {
    onClose()
  })

  React.useEffect(() => {
    setProgress(null)
  }, [open])

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
      >
        <DialogTitle>
          Upload file
        </DialogTitle>
        <DialogContent
          className={classes.root}
        >
          {
            progress == null
            && (
              <FileInputButton submitFile={handleChange}>
                choose file
              </FileInputButton>
            )
          }
          {
            progress !== null
            && (
              <Box paddingTop={2}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                />
              </Box>
            )
          }
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onClose}
            color="secondary"
          >
            close
          </Button>
        </DialogActions>
      </Dialog>
      <Button
        onClick={() => setOpen(true)}
        color="primary"
      >
        <AddIcon />
      </Button>
    </>
  )
}

export default UploadDialog
