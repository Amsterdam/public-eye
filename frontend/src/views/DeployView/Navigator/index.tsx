import React, { useState, useEffect } from 'react'
import * as R from 'ramda'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import { Typography } from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'
import JobsNavigator from 'common/JobsNavigator'
import SideBar from 'common/SideBar'
import Pagination, { NUMBER_OF_PAGINATION_ITEMS } from 'common/Pagination'
import restartJob from 'thunks/jobs/restartJob'
import getDeploys from 'thunks/deploys/getDeploys'
import { RootState } from 'reducers'
import { Deploy } from 'types'
import CaptureIcon from 'icons/Capture'
import MultiIcon from 'icons/MultiStream'
import SingleIcon from 'icons/SingleStream'
import { extractDeployName, usePage } from 'utils'
import NewCameraDialog from './NewCameraDialog'
import NewMultiDialog from './NewMultiDialog'
import CaptureDialog from './CaptureDialog'

const useStyles = makeStyles((theme) => ({
  button: {
    margin: theme.spacing(1),
  },
  actions: {
    minWidth: 300,
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
    height: `calc(100vh - ${theme.spacing(14)}px)`,
    padding: theme.spacing(1),
  },
  navigator: {
    overflowY: 'auto',
    height: `calc(100vh - ${theme.spacing(24)}px)`,
  },
}))

type NavigatorProps = {
  selectedIndex: number,
}

const Navigator = (props: NavigatorProps) => {
  const {
    selectedIndex,
  } = props
  const history = useHistory()
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [multiDialogOpen, setMultiDialogOpen] = useState(false)
  const [selectedJobLoad, setSelectedJobLoad] = useState(null)
  const page = usePage()
  const deploys = useSelector((state: RootState) => state.deploys)
  const itemsCount = useSelector((state: RootState) => state.pagination.deploys.total)

  const scriptNameToIcon = React.useCallback((scriptName: string) => {
    if (scriptName.includes('stream_multicapture.py')) {
      return <MultiIcon />
    }
    if (scriptName.includes('stream_capture.py')) {
      return <SingleIcon />
    }
    if (scriptName.includes('capture_camera.py')) {
      return <CaptureIcon />
    }
    return ''
  }, [])

  const handleItem = React.useCallback((streamInstance: Deploy) => {
    const {
      id: jobId,
      job_status: status,
      job_script_payload: jobLoad,
      job_script_path: scriptName,
    } = streamInstance

    const multicapture = scriptName.includes('stream_multicapture.py')
    const name = extractDeployName(jobLoad)

    const onClick = () => {
      history.push(`/deploy/${jobId}?page=${page}`)
    }

    const reload = () => {
      dispatch(restartJob(jobId))
    }

    const clone = () => {
      if (multicapture === true) {
        setMultiDialogOpen(true)
      } else {
        setDialogOpen(true)
      }
      setSelectedJobLoad(JSON.parse(jobLoad))
    }

    return {
      onClick,
      status,
      name: (
        <Box display="flex" alignItems="center">
          <Box width={36}>
            {
              scriptNameToIcon(scriptName)
            }
          </Box>
          <Typography>
            {name}
          </Typography>
        </Box>
      ),
      index: jobId,
      reload,
      clone,
    }
  }, [dispatch, scriptNameToIcon, page, history])

  const items = React.useMemo(() => (
    R.pipe(
      R.map(handleItem),
    )(Array.from(deploys.values()))
  ), [deploys, handleItem])

  useEffect(() => {
    if (multiDialogOpen === false || dialogOpen === false) {
      setSelectedJobLoad(null)
    }
  }, [multiDialogOpen, dialogOpen])

  React.useEffect(() => {
    dispatch(getDeploys((page - 1) * NUMBER_OF_PAGINATION_ITEMS, NUMBER_OF_PAGINATION_ITEMS))
  }, [dispatch, page])

  const navigate = React.useCallback((newPage: number) => {
    history.push(`/deploy${selectedIndex ? `/${selectedIndex}` : ''}?page=${newPage}`)
  }, [selectedIndex, history])

  return (
    <>
      <SideBar>
        <div className={classes.actions}>
          <CaptureDialog />
          <Button
            color="primary"
            variant="contained"
            className={classes.button}
            onClick={() => setDialogOpen(true)}
          >
            <AddIcon fontSize="small" />
            stream
          </Button>
          <Button
            color="primary"
            variant="contained"
            className={classes.button}
            onClick={() => setMultiDialogOpen(true)}
          >
            <AddIcon fontSize="small" />
            multi
          </Button>
        </div>
        <div>
          <div className={classes.navigator}>
            <JobsNavigator selectedIndex={selectedIndex} items={items} />
          </div>
          <Pagination
            numberOfItems={itemsCount}
            page={page}
            changePage={navigate}
          />
        </div>
      </SideBar>
      {
        dialogOpen
        && (
          <NewCameraDialog
            preset={selectedJobLoad}
            open={dialogOpen}
            handleClose={() => setDialogOpen(false)}
          />
        )
      }
      {
        multiDialogOpen
        && (
          <NewMultiDialog
            preset={selectedJobLoad}
            open={multiDialogOpen}
            handleClose={() => setMultiDialogOpen(false)}
          />
        )
      }
    </>
  )
}

export default Navigator
