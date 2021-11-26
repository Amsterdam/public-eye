import React, { useState, useEffect } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { getToken, useSelectedId } from 'utils'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import { Box, Card } from '@material-ui/core'
import getFramesAndLabelsForDataset from 'thunks/datasets/getFramesAndLabelsForDataset'
import { RootState } from 'reducers'

const useStyles = makeStyles((theme) => ({
  image: {
    width: '47%',
    height: 'auto',
  },
  card: {
    justifyContent: 'space-between',
    display: 'flex',
    padding: theme.spacing(1),
  },
}))

const LoiDataset = (): React.ReactElement => {
  const dispatch = useThunkDispatch()
  const classes = useStyles()
  // @ts-ignore
  const selectedId = useSelectedId()
  const token = getToken()
  const baseUrl = useSelector((state: RootState) => state.general.baseUrl)
  const [framePairs, setFramePairs] = useState([])

  const makeFrameUrl = (id: number) => `${baseUrl}/files/frames/${id}?tk=${token}`

  useEffect(() => {
    if (selectedId === null) return
    // @ts-ignore
    dispatch(getFramesAndLabelsForDataset(selectedId))
      .then((result) => {
        if (result) {
          // @ts-ignore
          setFramePairs(result)
        }
      })
  }, [selectedId, dispatch])

  return (
    <Box
      width="100%"
      display="flex"
      alignItems="center"
      flexDirection="column"
    >
      {framePairs.map(({ input_frame_id: inputFrameId, target_frame_id: targetFrameId, id }) => (
        <Box
          key={id}
          maxWidth={800}
          padding={1}
        >
          <Card
            className={classes.card}
          >
            <img alt="input_frame" src={makeFrameUrl(inputFrameId)} className={classes.image} />
            <img alt="target_frame" src={makeFrameUrl(targetFrameId)} className={classes.image} />
          </Card>
        </Box>
      ))}
    </Box>
  )
}

export default LoiDataset
