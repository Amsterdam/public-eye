import React from 'react'
import {
  makeStyles,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@material-ui/core'
import { Dataset } from 'types'

const useStyles = makeStyles((theme) => ({
  formControl: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
    width: 200,
  },
}))

const DatasetSelector = ({
  value,
  onChange,
  datasets,
  title,
  disabled,
}: {
  value: string,
  onChange: () => void,
  datasets: Dataset[],
  title: string,
  disabled: boolean | undefined,
}) => {
  const classes = useStyles()

  return (
    <FormControl
      variant="outlined"
      className={classes.formControl}
    >
      <InputLabel>
        {title}
      </InputLabel>
      <Select
        disabled={!!disabled}
        onChange={onChange}
        value={value}
      >
        {
          datasets.map(({ id, name: optionName, frame_count: frameCount }) => (
            <MenuItem key={id} value={id}>
              {`${optionName} #(${frameCount})`}
            </MenuItem>
          ))
        }
      </Select>
    </FormControl>
  )
}

export default DatasetSelector
