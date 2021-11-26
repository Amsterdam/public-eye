import React from 'react'
import * as yup from 'yup'
import { makeStyles } from '@material-ui/core/styles'
import { useThunkDispatch } from 'store'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'
import { useFormik } from 'formik'
import splitDataset from 'thunks/jobs/splitDataset'
import getDatasetById from 'thunks/datasets/getDatasetById'
import setInfo from 'actions/general/setInfo'
import { Dataset } from 'types'
import assert from 'assert'

const useStyles = makeStyles((theme) => ({
  root: {
    width: 200,
  },
  textField: {
    marginTop: theme.spacing(1),
  },
}))

type SplitDialogProps = {
  open: boolean,
  handleClose: () => null,
  datasetId: number,
}

const validationSchema = yup.object({
  dataset_name_1: yup
    .string()
    .required('dataset name 1 is required'),
  dataset_name_2: yup
    .string()
    .required('Dataset name 2 is required'),
  split: yup
    .number()
    .min(0, 'Split should be between 0 and 1')
    .max(1, 'Split should be between 0 and 1')
    .required('Split is required'),
})

const getDataset1End = (split: string) => {
  try {
    const casted = Number(split)
    if (casted < 0 || casted > 1) {
      return NaN
    }
    return `${(casted * 100).toFixed(2)} %`
  } catch {
    return ''
  }
}

const getDataset2End = (split: string) => {
  try {
    const casted = Number(split)
    if (casted < 0 || casted > 1) {
      return NaN
    }
    return `${((1 - casted) * 100).toFixed(2)} %`
  } catch {
    return ''
  }
}

const useDataset = (datasetId: number | null) => {
  const dispatch = useThunkDispatch()
  const [dataset, setDataset] = React.useState<Dataset | null>(null)

  React.useEffect(() => {
    if (datasetId !== null) {
      dispatch(getDatasetById(Number(datasetId)))
        .then((newDataset) => {
          if (newDataset !== null) {
            // @ts-ignore
            setDataset(newDataset)
          }
        })
    }
  }, [dispatch, datasetId])

  return dataset
}

const SplitDialog = (props: SplitDialogProps): React.ReactElement => {
  const {
    open,
    handleClose,
    datasetId,
  } = props

  const dispatch = useThunkDispatch()
  const classes = useStyles()
  const dataset = useDataset(datasetId)

  const submit = React.useCallback((
    values: {
      split: string,
      dataset_name_1: string,
      dataset_name_2: string,
    },
  ) => {
    try {
      const value = Number(values.split)

      assert(value > 0 && value < 1, 'split must be lower than 1 and larger than 0.')
      const jobArgs = {
        dataset_id: datasetId,
        split: value,
        dataset_name_1: values.dataset_name_1,
        dataset_name_2: values.dataset_name_2,
      }
      dispatch(splitDataset(jobArgs))
      handleClose()
    } catch (e) {
      dispatch(setInfo(true, 'Split must be float between 0 and 1.'))
    }
  }, [datasetId, dispatch, handleClose])

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      dataset_name_1: (dataset && `${dataset.name}_TRAIN`) || '',
      dataset_name_2: (dataset && `${dataset.name}_VAL`) || '',
      split: '',
    },
    validationSchema,
    onSubmit: (values) => {
      submit(values)
    },
  })

  return (
    <Dialog
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>
        Split dataset
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent className={classes.root}>
          <div className={classes.textField}>
            <TextField
              fullWidth
              label="dataset name 1"
              name="dataset_name_1"
              id="dataset_name_1"
              value={formik.values.dataset_name_1}
              onChange={formik.handleChange}
              error={(
                formik.touched.dataset_name_1
                && Boolean(formik.errors.dataset_name_1)
              )}
              helperText={(
                formik.touched.dataset_name_1
                && formik.errors.dataset_name_1
              )}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {getDataset1End(formik.values.split)}
                  </InputAdornment>
                ),
              }}
            />
          </div>
          <div className={classes.textField}>
            <TextField
              fullWidth
              label="dataset name 2"
              name="dataset_name_2"
              id="dataset_name_2"
              value={formik.values.dataset_name_2}
              onChange={formik.handleChange}
              error={(
                formik.touched.dataset_name_2
                && Boolean(formik.errors.dataset_name_2)
              )}
              helperText={(
                formik.touched.dataset_name_2
                && formik.errors.dataset_name_2
              )}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {getDataset2End(formik.values.split)}
                  </InputAdornment>
                ),
              }}
            />
          </div>
          <div className={classes.textField}>
            <TextField
              fullWidth
              label="split"
              name="split"
              id="split"
              value={formik.values.split}
              onChange={formik.handleChange}
              error={(
                formik.touched.split
                && Boolean(formik.errors.split)
              )}
              helperText={(
                formik.touched.split
                && formik.errors.split
              )}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
          >
            close
          </Button>
          <Button type="submit">
            submit
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default SplitDialog
