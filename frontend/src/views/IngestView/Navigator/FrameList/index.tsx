// @ts-nocheck
import React, {
  useMemo, useCallback, useRef, useState,
} from 'react'
import * as R from 'ramda'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import ForwardIcon from '@material-ui/icons/Forward'
import Button from '@material-ui/core/Button'
import List from '@material-ui/core/List'
import Typography from '@material-ui/core/Typography'
import SelectAllIcon from '@material-ui/icons/SelectAll'
import DeleteIcon from '@material-ui/icons/Delete'
import CalenderIcon from '@material-ui/icons/CalendarToday'
import { DateTimePicker } from '@material-ui/pickers'
import Tooltip from '@material-ui/core/Tooltip'
import IconButton from '@material-ui/core/IconButton'
import { getFileName, usePage } from 'utils'
import fetchVideoFrames from 'thunks/frames/fetchVideoFrames'
import fetchCollectionFrames from 'thunks/frames/fetchCollectionFrames'
import getClosestPage from 'thunks/collections/getClosestPage'
import Pagination, { NUMBER_OF_PAGINATION_ITEMS } from 'common/Pagination'
import { RootState } from 'reducers'
import { Collection, Video, Frame } from 'types'
import getVideoFile from 'thunks/staticFiles/getVideoFile'
import getCollectionById from 'thunks/collections/getCollectionById'
import { useMount } from 'react-use'
import FrameEntry from './FrameEntry'
import DeleteCollectionDialog from './DeleteCollectionDialog'

const useStyles = makeStyles((theme) => ({
  root: {
    width: 420,
  },
  header: {
    padding: theme.spacing(2),
    maxWidth: 420,
    borderBottom: '1px solid',
  },
  topHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  icon: {
    transform: 'rotate(-180deg)',
  },
  frameList: {
    padding: theme.spacing(1),
    overflow: 'auto',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 900,
    overflowWrap: 'anywhere',
    padding: theme.spacing(1),
  },
}))

type FrameListProps = {
  type: 'video' | 'collection',
  checkedItems: Record<string, unknown>,
  setCheckedItems: () => void,
  selectAllFrames: () => void,
  setPage: () => void,
  page: number,
}

const useEntry = (type: 'video' | 'collection') => {
  const dispatch = useThunkDispatch()
  const location = useLocation()
  const [entry, setEntry] = useState<Collection | Video | null>(null)
  const params = useParams<{ id: string | undefined }>()

  React.useEffect(() => {
    const { id } = params

    if (type === 'video') {
      dispatch(getVideoFile(Number(id)))
        .then((video) => {
          if (video !== null) {
            setEntry(video)
          }
        })
    }
    if (type === 'collection') {
      dispatch(getCollectionById(Number(id)))
        .then((collection) => {
          if (collection !== null) {
            setEntry(collection)
          }
        })
    }
  }, [dispatch, location, params, type])

  return entry
}

const useTitle = (
  type: 'video' | 'collection',
  entry: Video | Collection | null,
): string => {
  const title = useMemo(() => {
    if (entry === null) {
      return ''
    }

    if (type === 'video') {
      return getFileName((entry as Video).path)
    }

    if (type === 'collection') {
      return (entry as Collection).name
    }

    return ''
  }, [type, entry])

  return title
}

const useFramesFetchFunction = (
  type: 'video' | 'collection',
  entry: Video | Collection | null,
) => {
  const dispatch = useThunkDispatch()

  const fetch = React.useMemo(() => (
    type === 'video'
      ? (
        (skip: number, limit: number) => {
          if (!entry) return
          dispatch(fetchVideoFrames(entry.id, skip, limit))
        }
      ) : (
        (skip: number, limit: number) => {
          if (!entry) return
          dispatch(fetchCollectionFrames(entry.id, skip, limit))
        }
      )
  ), [dispatch, entry, type])

  return fetch
}

const useFrames = (
  framesFetchFunction: (skip: number, limit: number) => void,
  framesPage: number,
) => {
  const frames = useSelector((state: RootState) => state.navigator.frames)

  useMount(() => {
    framesFetchFunction(0, 25)
  })

  React.useEffect(() => {
    framesFetchFunction((framesPage - 1) * 25, 25)
  }, [framesFetchFunction, framesPage])

  return frames
}

const FrameList = (props: FrameListProps): React.ReactElement => {
  const {
    type,
    checkedItems,
    setCheckedItems,
    page,
    setPage,
    selectAllFrames,
  } = props

  const history = useHistory()
  const location = useLocation()

  const entry = useEntry(type)
  const title = useTitle(type, entry)
  const framesFetchFunction = useFramesFetchFunction(type, entry)
  const dispatch = useThunkDispatch()
  const classes = useStyles()
  const framesPage = usePage()
  const frames = useFrames(framesFetchFunction, framesPage)
  const [timePickerOpen, setTimePickerOpen] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [deleteCollectionDialogOpen, setDeleteCollectionDialogOpen] = useState(false)

  const createFrameEntry = useCallback((frame: Frame, index: number) => {
    if (entry === null) {
      return ''
    }
    return (
      <FrameEntry
        key={index}
        frame={frame}
        index={index}
        checked={checkedItems[frame.id] === true}
        locked={frame.locked === true}
        itemId={entry.id}
        page={page}
        itemType={type}
        setCheckedItems={setCheckedItems}
      />
    )
  }, [checkedItems, entry, type, setCheckedItems, page])

  const frameList = useMemo(() => {
    const { height } = (headerRef && headerRef.current)
      ? headerRef.current.getBoundingClientRect()
      : { height: 72.55 }

    return (
      <div className={classes.frameList} style={{ height: `calc(100vh - ${height + (8 * 38)}px)` }}>
        <List>
          {
            R.pipe(
              R.sortBy(R.prop('timestamp')),
              (tempFrames) => tempFrames.map(createFrameEntry),
            )(frames)
          }
        </List>
      </div>
    )
  }, [classes.frameList, createFrameEntry, frames])

  const commitJump = (date: Date) => {
    dispatch(getClosestPage(entry.id, NUMBER_OF_PAGINATION_ITEMS, date.toISOString()))
      .then((result) => {
        if (result) {
          setPage(result)
        }
      })
  }

  const navigate = React.useCallback((value: number) => {
    const url = `${location.pathname}?page=${value}`

    history.push(url)
  }, [history, location])

  if (entry === null) {
    return ''
  }

  return (
    <div className={classes.root}>
      <div ref={headerRef} className={classes.header}>
        <div className={classes.topHeaderRow}>
          <Button
            onClick={() => {
              const newPath = location.pathname.split('/').slice(0, 4).join('/')
              history.push(newPath)
            }}
            color="primary"
            variant="contained"
          >
            <ForwardIcon className={classes.icon} />
          </Button>
          <Typography className={classes.title}>
            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */ }
            {`${title}  (${String(entry.frame_locked_count || 0)}/${String(entry.frame_count || 0)})`}
          </Typography>
          <Tooltip
            enterDelay={500}
            leaveDelay={200}
            title="Select All Locked Frames"
          >
            <IconButton
              size="small"
              onClick={selectAllFrames}
            >
              <SelectAllIcon
                size="small"
              />
            </IconButton>
          </Tooltip>
          {
            type === 'collection'
            && (
              <>
                <Tooltip
                  enterDelay={500}
                  leaveDelay={200}
                  title="Jump to page close to time."
                >
                  <IconButton
                    size="small"
                    onClick={() => setTimePickerOpen(true)}
                  >
                    <CalenderIcon
                      size="small"
                    />
                  </IconButton>
                </Tooltip>
                <DateTimePicker
                  style={{ display: 'none' }}
                  open={timePickerOpen}
                  onClose={() => setTimePickerOpen(false)}
                  onChange={commitJump}
                  ampm={false}
                />
              </>
            )
          }
          {
            type === 'collection'
            && (
              <IconButton
                onClick={() => setDeleteCollectionDialogOpen(true)}
              >
                <DeleteIcon />
              </IconButton>
            )
          }
        </div>
      </div>
      { frameList }
      <Pagination
        changePage={navigate}
        numberOfItems={entry ? Number(entry.frame_count) : 0}
        page={framesPage}
        fetchFunction={framesFetchFunction}
      />
      {
        deleteCollectionDialogOpen
        && (
          <DeleteCollectionDialog
            open={deleteCollectionDialogOpen}
            handleClose={() => setDeleteCollectionDialogOpen(false)}
            id={entry.id}
          />
        )
      }
    </div>
  )
}

export default FrameList
