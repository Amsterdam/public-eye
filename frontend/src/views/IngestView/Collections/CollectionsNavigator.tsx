import React, {
  useCallback, useState, memo, useMemo,
} from 'react'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import * as R from 'ramda'
import {
  Box,
} from '@material-ui/core'
import SideBar from 'common/SideBar'
import getCollections from 'thunks/collections/getCollections'
import { RootState } from 'reducers'
import { useFrameView, useFilter } from 'utils'
import ItemList from '../Navigator/ItemList'
import FrameList from '../Navigator/FrameList'
import NavigatorHeader from '../Navigator/NavigatorHeader'
import Actions from './Actions'

const CollectionsNavigatorBody = ({
  setFramesPage,
  framesPage,
}: {
  setFramesPage: () => void,
  framesPage: number,
}) => {
  const history = useHistory()
  const isFrameView = useFrameView()
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})
  const dispatch = useThunkDispatch()
  const filter = useFilter()
  const frames = useSelector((state: RootState) => state.navigator.frames)
  // @ts-ignore
  const selectedFrameIds = Object.keys(checkedItems).filter((id) => checkedItems[id])
  const collections = useSelector((state: RootState) => state.ingest.collections)
  const collectionsCount = useSelector((state: RootState) => (
    state.pagination.collections.total
  ))

  const collectionsFetch = useCallback(
    // @ts-ignore
    (skip, limit) => dispatch(getCollections(skip, limit, filter)),
    [dispatch, filter],
  )

  const selectAllFrames = useCallback(() => {
    const newCheckedItems = R.pipe(
      // only select frames that are locked
      // @ts-ignore
      R.filter(({ locked }: { locked : boolean }) => locked),
      R.map(({ id }: { id: number }) => [id, true]),
      R.fromPairs,
      // @ts-ignore
    )(frames)
    // @ts-ignore
    setCheckedItems(newCheckedItems)
  }, [frames, setCheckedItems])

  const setFilterAction = useCallback((newFilter: string) => {
    if (newFilter === '') {
      history.push('/ingest/collections')
    } else {
      history.push(`/ingest/collections?filter=${newFilter}`)
    }
  }, [history])

  const list = useMemo(() => {
    if (isFrameView) {
      return (
        <FrameList
          selectAllFrames={selectAllFrames}
          frames={frames}
          setPage={setFramesPage}
          page={framesPage}
          type="collection"
          checkedItems={checkedItems}
          // @ts-ignore
          setCheckedItems={setCheckedItems}
        />
      )
    }
    return (
      <ItemList
        items={collections}
        itemCount={collectionsCount}
        type="collection"
        fetchFunction={collectionsFetch}
        setFramesPage={setFramesPage}
        checkedItems={checkedItems}
        filter={filter}
        // @ts-ignore
        setCheckedItems={setCheckedItems}
      />
    )
  }, [collectionsCount, checkedItems, frames, framesPage, selectAllFrames, setFramesPage,
    collections, collectionsFetch, filter, isFrameView])

  return (
    <SideBar>
      <Box>
        <NavigatorHeader />
        <Actions
          // @ts-ignore
          filter={filter}
          // @ts-ignore
          setFilter={setFilterAction}
          // @ts-ignore
          selectedFrameIds={selectedFrameIds}
        />
        {list}
      </Box>
    </SideBar>
  )
}

export default memo(CollectionsNavigatorBody)
