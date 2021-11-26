import React, { useRef, useCallback, useEffect } from 'react'
import * as R from 'ramda'
import { useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Hls from 'hls.js'
import { useMountEffect, getToken } from 'utils'
import { RootState } from 'reducers'

const useStyles = makeStyles((theme) => ({
  videoContainer: {
    width: '100%',
    padding: theme.spacing(2),
  },
  video: {
    width: '100%',
    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.6), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
  },
}))

type StreamPlayerProps = {
  url: string | null
}

const StreamPlayer = (props: StreamPlayerProps): React.ReactElement => {
  const {
    url,
  } = props

  const classes = useStyles()
  const ref = useRef(null)

  const token = getToken()
  const baseUrl = useSelector((state: RootState) => state.general.baseUrl)

  const setupVideo = useCallback(() => {
    if (!url) {
      return
    }

    const video = ref.current
    const videoSrc = `${baseUrl}/files/streams/${url}`

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr, tempUrl) => {
          // hacky solution to be able to encode the files in .m3u8 play list files
          const encodedURL = R.pipe(
            R.split('/'),
            (splitted) => R.update(-1, encodeURIComponent(splitted[splitted.length - 1]))(splitted),
            R.join('/'),
          )(tempUrl)
          xhr.open('GET', `${encodedURL}`, true);
          xhr.setRequestHeader('x-access-token', token)
        },
      })
      hls.loadSource(videoSrc)
      // @ts-ignore
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (video) {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          video.play()
        }
      })
    }
  }, [baseUrl, url, token])

  useMountEffect(setupVideo)

  useEffect(setupVideo, [setupVideo])

  return (
    <div className={classes.videoContainer}>
      {
        !url
          ? (
            <Typography>
              Video is not initialized properly yet.
            </Typography>
          ) : <video className={classes.video} ref={ref} id="video" controls />
      }
    </div>
  )
}

export default StreamPlayer
