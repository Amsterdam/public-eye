import React, { useMemo, useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useThunkDispatch } from 'store'
import JobsNavigator from 'common/JobsNavigator'
import { TrainingRun } from 'types'
import { useSelectedId, usePage } from 'utils'
import { RootState } from 'reducers'
import SideBar from 'common/SideBar'
import AddIcon from '@material-ui/icons/Add'
import {
  Box,
  Button,
  makeStyles,
  Typography,
} from '@material-ui/core'
import exportModel from 'thunks/training/exportModel'
import getTrainingRuns from 'thunks/training/getTrainingRuns'
import GpuInfo from 'common/GpuInfo'
import Pagination, { NUMBER_OF_PAGINATION_ITEMS } from 'common/Pagination'
import EmptyFallbackProgress from 'common/EmptyFallbackProgress'
import TrainingJobDialog from '../TrainingJobDialog'
import NavigationTabs from '../Navigator/NavigationTabs'

const useStyles = makeStyles((theme) => ({
  actions: {
    minWidth: 400,
    padding: theme.spacing(1),
    borderBottom: '1px solid',
    display: 'flex',
    justifyContent: 'space-between',
  },
  item: {
    display: 'flex',
  },
  icon: {
    paddingRight: theme.spacing(1),
    color: 'gray',
    display: 'flex',
    alignItems: 'center',
  },
  list: {
    overflowY: 'auto',
    height: `calc(100vh - ${theme.spacing(28)}px)`,
    padding: theme.spacing(1),
  },
  navigator: {
    overflowY: 'auto',
    height: `calc(100vh - ${theme.spacing(28)}px)`,
  },
  tabContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    borderBottom: '1px solid',
  },
}))

const Navigator = () => {
  const dispatch = useThunkDispatch()
  const classes = useStyles()
  const history = useHistory()
  const trainingRuns = useSelector((state: RootState) => state.training.trainingRuns)
  const itemCount = useSelector((state: RootState) => state.pagination.trainingRuns.total)
  const selectedId = useSelectedId(['/train/runs/:id'])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [gpuInfoOpen, setGpuInfoOpen] = React.useState(false)
  const [selectedJobLoad, setSelectedJobLoad] = useState({})

  const page = usePage()

  const handleTrainingRun = useCallback((trainingRun: TrainingRun) => {
    const {
      job_id: jobId,
      job_status: status,
      model_name: modelName,
      train_script: script,
      job_script_payload: jobLoad,
    } = trainingRun

    const onClick = () => {
      history.push(`/train/runs/${jobId}?page=${page}`)
    }

    const name = modelName || script

    const reload = () => {
      setDialogOpen(true)
      setSelectedJobLoad({
        ...JSON.parse(jobLoad),
        scriptName: script,
      })
    }

    return {
      name: (
        <Typography>
          {name}
        </Typography>
      ),
      status,
      onClick,
      index: jobId,
      reload,
    }
  }, [history, page])

  const trainingRunItems = useMemo(
    () => (
      trainingRuns
        ? Array.from(trainingRuns.values()).map(handleTrainingRun)
        : null
    ), [trainingRuns, handleTrainingRun],
  )

  const openTrainDialog = React.useCallback(() => {
    setDialogOpen(true)
    setSelectedJobLoad({})
  }, [])

  const commitExport = React.useCallback(() => {
    dispatch(exportModel(Number(selectedId)))
  }, [dispatch, selectedId])

  const navigate = React.useCallback((newPage: number) => {
    history.push(`/train/runs${selectedId ? `/${selectedId}` : ''}?page=${newPage}`)
  }, [selectedId, history])

  React.useEffect(() => {
    dispatch(getTrainingRuns((page - 1) * NUMBER_OF_PAGINATION_ITEMS, NUMBER_OF_PAGINATION_ITEMS))
  }, [page, dispatch])

  return (
    <>
      <SideBar>
        <Box
          display="flex"
          borderBottom="1px solid"
          padding={1}
          justifyContent="space-between"
        >
          <Button
            color="primary"
            variant="contained"
            onClick={openTrainDialog}
          >
            <AddIcon fontSize="small" />
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={() => setGpuInfoOpen(true)}
          >
            gpu info
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={!selectedId}
            onClick={commitExport}
          >
            export
          </Button>
        </Box>
        <NavigationTabs />
        <div className={classes.navigator}>
          <EmptyFallbackProgress
            isEmpty={trainingRunItems === null}
          >
            {
              trainingRunItems !== null
              && (
                <JobsNavigator
                  selectedIndex={selectedId && Number(selectedId)}
                  items={trainingRunItems}
                />
              )
            }
          </EmptyFallbackProgress>
          <TrainingJobDialog
            open={dialogOpen}
            setOpen={setDialogOpen}
            preset={selectedJobLoad}
          />
        </div>
        <Pagination
          numberOfItems={itemCount}
          page={page}
          changePage={navigate}
        />
      </SideBar>
      <GpuInfo
        open={gpuInfoOpen}
        handleClose={() => setGpuInfoOpen(false)}
      />
    </>
  )
}

export default Navigator
