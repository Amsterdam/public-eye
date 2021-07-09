import React, {
  useCallback, useState, memo, useMemo, useEffect,
} from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import * as R from 'ramda'
import {
  Box,
  TextField,
  Button,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import AddToCollectionDialog from 'common/AddToCollectionDialog'
import { NUMBER_OF_PAGINATION_ITEMS } from 'common/Pagination'
import SideBar from 'common/SideBar'
import { RootState } from 'reducers'
import getVideos from 'thunks/staticFiles/getVideos'
import { useFrameView, useFilter } from 'utils'
import UploadDialog from './UploadDialog'
import CreateDatasetDialog from '../Navigator/Actions/CreateDatasetDialog'
import ItemList from '../Navigator/ItemList'
import FrameList from '../Navigator/FrameList'
import NavigatorHeader from '../Navigator/NavigatorHeader'

const useActionStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(1),
    borderBottom: '0.5px solid grey',
  },
  button: {
    marginLeft: theme.spacing(0.5),
    marginRight: theme.spacing(0.5),
  },
  search: {
    width: '100%',
  },
}))

type ActionsProps = {
  selectedFrameIds: number[],
  filter: string,
  setFilter: () => void,
}

const Actions = memo(({ selectedFrameIds, filter, setFilter }: ActionsProps) => {
  const classes = useActionStyles()
  const [addToCollectionOpen, setAddtoCollectionOpen] = useState(false)

  return (
    <>
      <Box className={classes.root}>
        <Box
          display="flex"
          justifyContent="space-between"
        >
          <UploadDialog />
          <Button
            className={classes.button}
            color="primary"
            variant="contained"
            disabled={selectedFrameIds.length === 0}
            onClick={() => setAddtoCollectionOpen(true)}
          >
            add to collection
          </Button>
          <AddToCollectionDialog
            open={addToCollectionOpen}
            handleClose={() => setAddtoCollectionOpen(false)}
            selectedFrameIds={selectedFrameIds}
          />
          <CreateDatasetDialog
            selectedFrameIds={selectedFrameIds}
            disabled={selectedFrameIds.length === 0}
          />
        </Box>
        <Box
          paddingTop={2}
        >
          <TextField
            className={classes.search}
            label="filter"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
            value={filter}
          />
        </Box>
      </Box>
    </>
  )
})

type VideosNavigatorBodyProps = {
  setFramesPage: () => void,
  framesPage: number,
  selectedId: number,
}

const VideosNavigatorBody = ({
  setFramesPage,
  framesPage,
  selectedId,
}: VideosNavigatorBodyProps) => {
  const isFrameView = useFrameView()
  const history = useHistory()
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})
  const dispatch = useThunkDispatch()
  const filter = useFilter()
  const frames = useSelector((state: RootState) => state.navigator.frames)
  const selectedFrameIds = Object.keys(checkedItems).filter((id) => checkedItems[id])
  const videos = useSelector((state: RootState) => state.ingest.videos)
  const videoCount = useSelector((state: RootState) => state.pagination.videos.total)

  const selectAllFrames = useCallback(() => {
    const newCheckedItems = R.pipe(
      // only select frames that are locked
      R.filter(({ locked }: { locked: boolean }) => locked),
      R.map(({ id }: { id: number }) => [id, true]),
      R.fromPairs,
    )(frames)
    setCheckedItems(newCheckedItems)
  }, [frames, setCheckedItems])

  const videoFetch = useCallback((skip, limit) => {
    dispatch(getVideos(skip, limit, filter))
  }, [dispatch, filter])

  const list = useMemo(() => {
    if (isFrameView) {
      return (
        <FrameList
          selectAllFrames={selectAllFrames}
          frames={frames}
          setPage={setFramesPage}
          page={framesPage}
          type="video"
          checkedItems={checkedItems}
          setCheckedItems={setCheckedItems}
        />
      )
    }
    return (
      <ItemList
        items={videos}
        itemCount={videoCount}
        type="video"
        filter={filter}
        selectedId={selectedId}
        fetchFunction={videoFetch}
        setFramesPage={setFramesPage}
        checkedItems={checkedItems}
        setCheckedItems={setCheckedItems}
      />
    )
  }, [videoCount, checkedItems, frames, framesPage, selectAllFrames, setFramesPage,
    videos, selectedId, videoFetch, filter, isFrameView])

  const setFilterAction = useCallback((newFilter: string) => {
    if (newFilter === '') {
      history.push('/ingest/videos')
    } else {
      history.push(`/ingest/videos?filter=${newFilter}`)
    }
  }, [history])

  return (
    <SideBar>
      <Box>
        <NavigatorHeader />
        <Actions
          filter={filter}
          setFilter={setFilterAction}
          selectedFrameIds={selectedFrameIds}
        />
        {list}
      </Box>
    </SideBar>
  )
}

export default memo(VideosNavigatorBody)
