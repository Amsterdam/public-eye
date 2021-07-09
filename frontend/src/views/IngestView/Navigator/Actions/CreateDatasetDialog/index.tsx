import React, { useCallback, useState } from 'react'
import * as R from 'ramda'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent/'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Button from '@material-ui/core/Button'
import { RootState } from 'reducers'
import DialogBody from './DialogBody'

const useStyles = makeStyles((theme) => ({
  content: {
    width: 500,
  },
  textField: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}))

const CreateDatasetDialog = ({
  selectedFrameIds,
  disabled,
}: {
  selectedFrameIds: string[],
  disabled: boolean,
}) => {
  const classes = useStyles()
  const [nnType, setNnType] = useState('density_estimation')
  const selectedItem = useSelector((state: RootState) => R.path(['general', 'itemSelected'], state))

  const [open, setOpen] = useState(false)

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

  const handleNnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNnType(event.target.value)
  }

  return (
    <>
      <Dialog
        onClose={handleClose}
        open={open}
      >
        <DialogTitle>
          {
            selectedFrameIds.length === 0 && selectedItem && selectedItem.type
              ? `Create Dataset from Collection: ${String(selectedItem.name)}`
              : 'Create Dataset'
          }
        </DialogTitle>
        <DialogContent className={classes.content}>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={nnType}
            onChange={handleNnChange}
          >
            <MenuItem value="density_estimation">density estimation</MenuItem>
            <MenuItem value="object_recognition">object recognition</MenuItem>
            <MenuItem value="loi">line of interest</MenuItem>
          </Select>
        </DialogContent>
        <DialogBody
          nnType={nnType}
          selectedFrameIds={selectedFrameIds}
          handleClose={handleClose}
        />
      </Dialog>
      <Button
        color="primary"
        variant="contained"
        onClick={handleOpen}
        disabled={disabled}
      >
        make dataset
      </Button>
    </>
  )
}

export default CreateDatasetDialog
