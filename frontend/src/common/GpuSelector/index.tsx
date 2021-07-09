import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useThunkDispatch } from 'store'
import * as R from 'ramda'
import getGpuCount from 'thunks/gpu/getGpuCount'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import { useMountEffect } from 'utils'

const useStyles = makeStyles((theme) => ({
  formControl: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
    minWidth: '100%',
  },
}))

const GpuSelector = ({
  selectedGpu = null,
  setSelectedGpu,
}: {
  selectedGpu: number,
  setSelectedGpu: () => void,
}) => {
  const [gpuCount, setGpuCount] = useState(null)
  const dispatch = useThunkDispatch()
  const classes = useStyles()

  useMountEffect(() => {
    dispatch(getGpuCount())
      .then((result) => {
        if (result !== null && result > 1) {
          setGpuCount(result)
        }
      })
  }, [])

  return gpuCount > 1
    ? (
      <div>
        <FormControl variant="outlined" className={classes.formControl}>
          <InputLabel>Select Gpu</InputLabel>
          <Select
            value={selectedGpu}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedGpu(e.target.value)}
          >
            {
              R.range(0, gpuCount)
                .map((count) => (
                  <MenuItem key={count} value={count}>{`GPU: ${count}`}</MenuItem>
                ))
            }
          </Select>
        </FormControl>
      </div>
    ) : ''
}

export default GpuSelector
