import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import ListItem from '@material-ui/core/ListItem'
import Tooltip from '@material-ui/core/Tooltip'
import Typography from '@material-ui/core/Typography'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import IconButton from '@material-ui/core/IconButton'
import HorizontalSplitIcon from '@material-ui/icons/HorizontalSplit'
import { VoidFunction } from 'types'
import SplitDialog from './SplitDialog'
import DatasetIcon from './DatasetIcon'

const useStyles = makeStyles(() => ({
  text: {
    display: 'flex',
    alignItems: 'center',
  },
}))

type DatasetListItemProps = {
  onClick: VoidFunction,
  index: number,
  name: string,
  datasetId: number,
  nnType: string,
  selectedId: string,
}

const DatasetListItem = (props: DatasetListItemProps): React.ReactElement => {
  const {
    onClick,
    index,
    name,
    datasetId,
    nnType,
    selectedId,
  } = props

  const classes = useStyles()

  const [splitDialogOpen, setSplitDialogOpen] = useState(false)

  return (
    <>
      <ListItem
        key={index}
        button
        onClick={onClick}
        selected={datasetId === Number(selectedId)}
      >
        <Typography className={classes.text} variant="body2">
          <DatasetIcon nnType={nnType} />
          { name }
        </Typography>
        <ListItemSecondaryAction>
          <Tooltip title="Split dataset">
            <IconButton
              onClick={() => setSplitDialogOpen(true)}
            >
              <HorizontalSplitIcon />
            </IconButton>
          </Tooltip>
        </ListItemSecondaryAction>
      </ListItem>
      <SplitDialog
        open={splitDialogOpen}
        handleClose={() => setSplitDialogOpen(false)}
        datasetId={datasetId}
      />
    </>
  )
}

export default DatasetListItem
