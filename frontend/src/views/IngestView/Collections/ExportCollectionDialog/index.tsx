import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Radio from '@material-ui/core/Radio';
import Button from '@material-ui/core/Button'
import exportCollection from 'thunks/collections/exportCollection'

const useStyles = makeStyles({
  root: {
    width: 500,
  },
})

const ExportCollectionDialog = ({
  open,
  handleClose,
  collectionId = null,
}: {
  open: boolean,
  handleClose: () => void,
  collectionId: number | null,
}) => {
  const classes = useStyles()
  const dispatch = useDispatch()

  const [dataType, setDataType] = useState('object')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataType(e.target.value)
  }

  const submitAction = () => {
    dispatch(exportCollection(collectionId, dataType))
    handleClose()
  }

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>
        Export Collection
      </DialogTitle>
      <DialogContent className={classes.root}>
        <FormControl component="fieldset">
          <FormLabel component="legend"> Data Type </FormLabel>
          <RadioGroup value={dataType} onChange={handleChange}>
            <FormControlLabel value="object" control={<Radio />} label="Object Recognition" />
            <FormControlLabel value="density" control={<Radio />} label="Density Estimation" />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
        <Button
          onClick={submitAction}
          color="primary"
          autoFocus
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ExportCollectionDialog
