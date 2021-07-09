import React, { useCallback, useMemo, memo } from 'react'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useThunkDispatch } from 'store'
import {
  pathOr,
  pipe,
  map,
} from 'ramda'
import { makeStyles } from '@material-ui/core/styles'
import JobsNavigator from 'common/JobsNavigator'
import SideBar from 'common/SideBar'
import Pagination, { NUMBER_OF_PAGINATION_ITEMS } from 'common/Pagination'
import EmptyFallbackProgress from 'common/EmptyFallbackProgress'
import restartJob from 'thunks/jobs/restartJob'
import getAllJobs from 'thunks/jobs/getAllJobs'
import { Job } from 'types'
import { useSelectedId, getFileName, usePage } from 'utils'
import { RootState } from 'reducers'
import { Typography } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  root: {
    wordWrap: 'anywhere',
  },
  navigator: {
    height: `calc(100vh - ${theme.spacing(15)}px)`,
    overflow: 'auto',
  },
}))

const Navigator = ({
  jobs,
}: {
  jobs: Map<number, Job>,
}): React.ReactElement => {
  const history = useHistory()
  const selectedId = useSelectedId(['/jobs/:id'])
  const page = usePage()
  const jobsCount = useSelector((state: RootState) => (
    pathOr(1, ['pagination', 'jobs', 'total'], state)
  ))
  const classes: {
    root: string,
    navigator: string,
  } = useStyles()
  const dispatch = useThunkDispatch()

  const handleItem = useCallback(({
    id,
    job_script_path: path,
    job_status: status,
  }: Job): {
      index: number,
      reload: () => void,
      name: string,
      status: string,
      onClick: () => void,
    } => {
    const name = getFileName(path)

    const onClick = () => {
      history.push(`/jobs/${id}?page=${page}`)
    }

    const reload = () => {
      dispatch(restartJob(id))
    }

    return {
      index: id,
      reload,
      name: (
        <Typography>
          {name}
        </Typography>
      ),
      status,
      onClick,
    }
  }, [dispatch, history, page])

  const items = useMemo(() => pipe(
    (tempJobs: Map<number, Job>) => Array.from(tempJobs.values()),
    map(handleItem),
  )(jobs || new Map()), [handleItem, jobs])

  React.useEffect(() => {
    dispatch(getAllJobs((page - 1) * NUMBER_OF_PAGINATION_ITEMS, NUMBER_OF_PAGINATION_ITEMS))
  }, [dispatch, page])

  const navigate = React.useCallback((newPage: number) => {
    history.push(`/jobs${selectedId ? `/${selectedId}` : ''}?page=${newPage}`)
  }, [history, selectedId])

  return (
    <SideBar>
      <div className={classes.root}>
        <div className={classes.navigator}>
          <EmptyFallbackProgress
            isEmpty={jobs === null}
          >
            <JobsNavigator
              selectedIndex={selectedId && Number(selectedId)}
              items={items}
            />
          </EmptyFallbackProgress>
        </div>
        <Pagination
          numberOfItems={jobsCount}
          page={page}
          changePage={navigate}
        />
      </div>
    </SideBar>
  )
}

export default memo(Navigator)
