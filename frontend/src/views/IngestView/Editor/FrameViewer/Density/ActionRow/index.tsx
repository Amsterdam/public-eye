import React from 'react'
import { useThunkDispatch } from 'store'
import {
  filter,
} from 'ramda'
import {
  Button,
  Switch,
  Box,
  makeStyles,
  FormControlLabel,
  Slider,
  Typography,
} from '@material-ui/core'
import {
  ZoomIn as ZoomIcon,
} from '@material-ui/icons'
import deleteTag from 'thunks/tags/deleteTag'
import { Frame } from 'types'
import DeleteIcon from '@material-ui/icons/Delete'
import { StoreContext } from '../context'

const useStyles = makeStyles((theme) => ({
  button: {
    margin: theme.spacing(1),
  },
  slider: {
    width: 200,
  },
}))

const ActionRow = ({
  frame,
}: {
  frame: Frame,
}) => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const {
    choosingZoom: [choosingZoom, setChoosingZoom],
    identifiers: [hideIdentifiers, setHideIdentifiers],
    tags: [, setTags],
    selectedTagId: [selectedTagId, setSelectedTagId],
    zoomSize: [zoomSize, setZoomSize],
  } = React.useContext(StoreContext)

  const onDeleteTag = React.useCallback(() => {
    dispatch(deleteTag(frame.id, selectedTagId as number))
      .then((success) => {
        if (success) {
          setTags((oldTags) => filter(({ id }) => id !== selectedTagId, oldTags))
          setSelectedTagId(null)
        }
      })
  }, [dispatch, frame.id, selectedTagId, setTags, setSelectedTagId])

  return (
    <Box display="flex" justifyContent="space-between">
      <Box display="flex" alignItems="center">
        <Box>
          <Button
            className={classes.button}
            disabled={choosingZoom}
            variant="outlined"
            onClick={() => setChoosingZoom(true)}
            color="primary"
            startIcon={<ZoomIcon />}
          >
            Select zoom
          </Button>
        </Box>
        <FormControlLabel
          className={classes.button}
          control={(
            <Switch
              checked={!hideIdentifiers}
              onChange={() => setHideIdentifiers(!hideIdentifiers)}
              value="hide"
              color="primary"
            />
          )}
          label="show identifiers"
        />
        <Box padding={2}>
          <Typography id="discrete-slider" gutterBottom>
            zoom size
          </Typography>
          <Slider
            className={classes.slider}
            aria-labelledby="discrete-slider"
            valueLabelDisplay="auto"
            min={20}
            max={200}
            // @ts-ignore
            onChange={(e, value) => setZoomSize(value)}
            value={zoomSize}
          />
        </Box>
      </Box>
      <div>
        <Button
          disabled={selectedTagId === null || frame.locked}
          variant="outlined"
          onClick={onDeleteTag}
          className={classes.button}
          color="secondary"
          startIcon={<DeleteIcon />}
        >
          DELETE TAG
        </Button>
      </div>
    </Box>
  )
}

export default React.memo(ActionRow)
