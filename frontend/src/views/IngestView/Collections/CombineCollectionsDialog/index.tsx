import React, { useCallback, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Select from '@material-ui/core/Select'
import Input from '@material-ui/core/Input'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'
import Chip from '@material-ui/core/Chip'
import Button from '@material-ui/core/Button'
import combineCollections from 'thunks/jobs/combineCollections'
import getAllCollections from 'thunks/collections/getAllCollections'
import { RootState } from 'reducers'
import { Collection } from 'types'

const useStyles = makeStyles((theme) => ({
  root: {
    width: 500,
  },
  textField: {
    width: 300,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 2,
  },
  margin: {
    margin: theme.spacing(1),
    padding: theme.spacing(1),
  },
}))

const CombineCollectionsDialog = (): JSX.Element => {
  const classes = useStyles()
  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState([])
  const [collectionName, setCollectionName] = useState('')
  const collections = useSelector((state: RootState) => state.ingest.allCollections)

  useEffect(() => {
    if (collections === null) {
      dispatch(getAllCollections())
    }
  }, [collections, dispatch])

  const handleClose = useCallback(() => { setOpen(false) }, [])
  const handleOpen = useCallback(() => { setOpen(true) }, [])

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // @ts-ignore
    setSelected(event.target.value)
  }, [])

  const submitAction = useCallback(() => {
    const nameMapToId = {}

    // @ts-ignore
    collections.forEach((col: Collection) => {
      // @ts-ignore
      nameMapToId[col.name] = col.id
    })

    const collectionIds = selected.map((name) => nameMapToId[name])

    dispatch(combineCollections(collectionIds, collectionName))
    setOpen(false)
  }, [collectionName, collections, dispatch, selected])

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
      >
        combine
      </Button>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>
          Combine Collections
        </DialogTitle>
        <DialogContent className={classes.root}>
          <div className={classes.margin}>
            <Select
              labelId="demo-mutiple-chip-label"
              id="demo-mutiple-chip"
              multiple
              value={selected}
              // @ts-ignore
              onChange={handleChange}
              input={<Input id="select-multiple-chip" />}
              // @ts-ignore
              renderValue={(tempSelected: Collection[]) => (
                <div className={classes.chips}>
                  {/* @ts-ignore */}
                  {tempSelected.map((value: string) => (
                    <Chip key={value} label={value} className={classes.chip} />
                  ))}
                </div>
              )}
            >
              {(collections || []).map(({ name }: Collection) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </div>
          <div className={classes.margin}>
            <TextField
              label="Collection Name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
            />
          </div>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Disagree
          </Button>
          <Button
            onClick={submitAction}
            color="primary"
            autoFocus
            disabled={selected.length < 2 || collectionName === ''}
          >
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CombineCollectionsDialog
