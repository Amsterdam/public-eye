// @ts-nocheck
import React, { useState, useEffect } from 'react'
import * as R from 'ramda'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Autocomplete from '@material-ui/lab/Autocomplete'
import Button from '@material-ui/core/Button'
import getLabels from 'thunks/frames/getLabels'
import insertLabel from 'thunks/frames/insertLabel'
import insertBoundingBox from 'thunks/frames/insertBoundingBox'
import deleteBoundingBox from 'thunks/frames/deleteBoundingBox'
import updateBoundingBoxLabel from 'thunks/frames/updateBoundingBoxLabel'
import { BoundingBox, ObjectLabel } from 'types'
import { useMountEffect } from 'utils'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(1),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoComplete: {
    width: 300,
  },
  buttons: {
    display: 'flex',
  },
  button: {
    margin: theme.spacing(1),
  },
}))

type Coord = { x: number, y: number }
type ActionRowProps = {
  firstPositionCoords: Coord,
  secondPositionCoords: Coord,
  resetCoords: () => void,
  imageWidth: number,
  imageHeight: number,
  frameId: number,
  setBoundingBoxes: () => void,
  boundingBoxSelected: BoundingBox,
}

const ActionRow = (props: ActionRowProps): React.ReactElement => {
  const {
    firstPositionCoords,
    secondPositionCoords,
    resetCoords,
    imageWidth,
    imageHeight,
    frameId,
    setBoundingBoxes,
    boundingBoxSelected,
  } = props

  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [labels, setLabels] = useState([])
  const [labelName, setLabelName] = useState('')

  useMountEffect(() => {
    dispatch(getLabels())
      .then((result) => {
        if (result) {
          // @ts-ignore
          setLabels(result)
        }
      })
  })

  const randomHex = () => {
    const options = '0123456789ABCDEF'
    let color = '#'

    color += options[(Math.floor(Math.random() * 16))]
    color += options[(Math.floor(Math.random() * 16))]
    color += options[(Math.floor(Math.random() * 16))]
    color += options[(Math.floor(Math.random() * 16))]
    color += options[(Math.floor(Math.random() * 16))]
    color += options[(Math.floor(Math.random() * 16))]

    return color
  }

  const onSubmit = async () => {
    const hex = randomHex()

    if (boundingBoxSelected) {
      // @ts-ignore
      const label = labels.find((l) => l.name === labelName)
      if (!label) {
        const newLabel = await dispatch(insertLabel(labelName, hex))
        setLabels((tempLabels) => R.append(newLabel, tempLabels))
        const bb = await dispatch(
          updateBoundingBoxLabel(frameId, boundingBoxSelected.bb_id, newLabel.id),
        )
        setBoundingBoxes((tempBoundingBoxes) => R.append(bb, tempBoundingBoxes))
      } else {
        const bb = await dispatch(updateBoundingBoxLabel(
          frameId, boundingBoxSelected.bb_id, label.id,
        ))
        setBoundingBoxes((tempBoundingBoxes) => R.append(bb, tempBoundingBoxes))
      }
      return
    }

    const label = labels.find((l) => l.name === labelName)
    const topLeftX = firstPositionCoords.x < secondPositionCoords.x
      ? firstPositionCoords.x
      : secondPositionCoords.x

    const topLeftY = firstPositionCoords.y < secondPositionCoords.y
      ? firstPositionCoords.y
      : secondPositionCoords.y

    const width = Math.abs(secondPositionCoords.x - firstPositionCoords.x)
    const height = Math.abs(secondPositionCoords.y - firstPositionCoords.y)

    const x = (topLeftX + (width / 2)) / imageWidth
    const y = (topLeftY + (height / 2)) / imageHeight
    const w = width / imageWidth
    const h = height / imageHeight

    if (!label) {
      const newLabel = await dispatch(insertLabel(labelName, hex))
      setLabels((tempLabels) => R.append(newLabel, tempLabels))
      const bb = await dispatch(insertBoundingBox(frameId, newLabel.id, x, y, w, h))
      setBoundingBoxes((tempBoundingBoxes) => R.append(bb, tempBoundingBoxes))
    } else {
      const bb = await dispatch(insertBoundingBox(frameId, label.id, x, y, w, h))
      setBoundingBoxes((tempBoundingBoxes) => R.append(bb, tempBoundingBoxes))
    }
    setLabelName('')
    resetCoords()
  }

  useEffect(() => {
    if (boundingBoxSelected) {
      setLabelName(boundingBoxSelected.name)
    } else {
      setLabelName('')
    }
  }, [boundingBoxSelected])

  const emitDeleteBoundingBox = async () => {
    const deleted = await dispatch(deleteBoundingBox(frameId, boundingBoxSelected.bb_id))
    if (deleted) {
      setBoundingBoxes((boundingBoxes) => R.filter(
        (bb) => bb.bb_id !== boundingBoxSelected.bb_id, boundingBoxes,
      ))
    }
  }

  return (
    <div className={classes.root}>
      <Autocomplete
        className={classes.autoComplete}
        freeSolo
        options={labels.map((l: ObjectLabel) => l.name).filter((l) => l.includes(labelName))}
        disabled={!(firstPositionCoords && secondPositionCoords) && !boundingBoxSelected}
        onChange={(e, value) => setLabelName(value)}
        value={labelName}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Label"
            value={labelName}
            onChange={(e) => setLabelName(e.target.value)}
          />
        )}
      />
      <div className={classes.buttons}>
        <Button
          color="secondary"
          variant="outlined"
          className={classes.button}
          disabled={!boundingBoxSelected}
          onClick={emitDeleteBoundingBox}
        >
          Delete
        </Button>
        <Button
          className={classes.button}
          disabled={labelName === ''}
          color="primary"
          variant="outlined"
          onClick={onSubmit}
        >
          Submit
        </Button>
      </div>
    </div>
  )
}

export default ActionRow
