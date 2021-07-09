import React, {
  useEffect, memo, useRef, useCallback, useMemo,
} from 'react'
import * as R from 'ramda'
import { useDispatch, useSelector } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Card from '@material-ui/core/Card'
import red from '@material-ui/core/colors/red'
import getLogDump from 'thunks/jobs/getLogDump'
import { RootState } from 'reducers'

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(2),
    width: 500,
    height: 500,
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  pre: {
    whiteSpace: 'pre-line',
    wordWrap: 'break-word',
  },
  error: {
    color: red[800],
  },
  content: {
    height: 340,
    overflow: 'auto',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 0,
  },
}))

const isError = (line: string): boolean => line.startsWith('&$')
const stripPrefix = (line: string): string => (
  line.startsWith('&$') || line.startsWith('$&')
    ? line.substring(2)
    : line
)

type PropTypes = {
  jobId: number | null
}

const LogViewer = ({
  jobId = null,
}: PropTypes) => {
  const classes = useStyles()
  const dispatch = useDispatch()

  const logContent = useSelector(
    (state: RootState) => R.pathOr('', ['jobs', 'logData', jobId])(state) as string,
  )
  const atBottom = useRef(true)

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dispatch(getLogDump(jobId))
  }, [jobId, dispatch])

  useEffect(() => {
    if (!ref.current) return

    if (atBottom.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [logContent])

  const handleScroll = useCallback(() => {
    if (!ref.current) return

    atBottom.current = ref.current.scrollTop
      >= (ref.current.scrollHeight - ref.current.offsetHeight)
  }, [])

  const splittedOnNewLine = useMemo(() => {
    const splitOnNewLine = logContent.split('\n')
    const withError: { line: string, error: boolean }[] = []
    splitOnNewLine.forEach((line) => {
      stripPrefix(line).split('\\n').forEach((splittedLine) => {
        withError.push({
          line: splittedLine,
          error: isError(line),
        })
      })
    })
    return withError
  }, [logContent])

  return (
    <Card className={classes.root}>
      <CardHeader
        title="Tail of Log"
      />
      <CardContent onScroll={handleScroll} ref={ref} className={classes.content}>
        <pre className={classes.pre}>
          {
            splittedOnNewLine.map(({ line, error }, index) => (
              <p key={`${index}`} style={{ color: error ? red[800] : 'black' }}>
                {line}
              </p>
            ))
          }
        </pre>
      </CardContent>
    </Card>
  )
}

const areEqual = (prevProps: PropTypes, nextProps: PropTypes) => {
  if (
    prevProps.jobId === nextProps.jobId
  ) {
    return true
  }
  return false
}

export default memo(LogViewer, areEqual)
