import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
} from '@material-ui/core'
import Info from './Info'

const GpuDialog = ({
  open,
  handleClose,
}: {
  open: boolean,
  handleClose: () => void,
}): JSX.Element => (
  <Dialog open={open} onClose={handleClose}>
    <DialogTitle>
      Gpu Info
    </DialogTitle>
    <DialogContent>
      <Info open={open} />
    </DialogContent>
  </Dialog>
)

export default GpuDialog
