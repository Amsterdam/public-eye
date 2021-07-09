import React from 'react'
import {
  List,
  ListItem,
  Box,
  ListItemText,
  LinearProgress,
} from '@material-ui/core'
import getGpuInfo, { Gpu } from 'thunks/gpu/getGpuInfo'
import { useThunkDispatch } from 'store'

const useGpuInfo = (open: boolean) => {
  const dispatch = useThunkDispatch()
  const [info, setInfo] = React.useState<Gpu[] | null>(null)

  React.useEffect(() => {
    let isMounted = true
    let interval: NodeJS.Timeout | null = null

    const retrieve = () => {
      dispatch(getGpuInfo())
        .then((newInfo) => {
          if (newInfo !== null && isMounted) {
            setInfo(newInfo)
          }
        })
    }

    if (open) {
      retrieve()
      interval = setInterval(retrieve, 5000)
    }
    return () => {
      isMounted = false
      if (interval !== null) {
        clearInterval(interval)
      }
    }
  }, [dispatch, open])

  return info
}

const GpuItem = ({ gpu }: { gpu: Gpu }) => (
  <ListItem alignItems="flex-start">
    <Box paddingRight={4}>
      <ListItemText
        primary={gpu.name}
        secondary={gpu.uuid}
      />
    </Box>
    <Box paddingRight={4}>
      <ListItemText
        primary="Memory used"
        secondary={`${gpu['memory.used [MiB]']} /${gpu['memory.total [MiB]']} [MiB]`}
      />
      <LinearProgress
        variant="determinate"
        value={(100 * gpu['memory.used [MiB]']) / gpu['memory.total [MiB]']}
      />
    </Box>
    <Box>
      <ListItemText
        primary="Temperature"
        secondary={`${gpu['temperature.gpu']}\u00b0`}
      />
    </Box>
  </ListItem>
)

const GpuInfo = ({
  open,
}: {
  open: boolean,
}) => {
  const info = useGpuInfo(open)

  return (
    <List>
      {
        (info || []).map((gpu: Gpu) => (
          <GpuItem gpu={gpu} key={gpu.uuid} />
        ))
      }
    </List>
  )
}

export default React.memo(GpuInfo)
