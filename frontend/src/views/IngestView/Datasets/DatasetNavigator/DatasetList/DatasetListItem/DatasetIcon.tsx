import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import ReorderIcon from '@material-ui/icons/Reorder'
import DragIndicator from '@material-ui/icons/DragIndicator'
import CenterFoxusStrong from '@material-ui/icons/CenterFocusStrong'

type DatasetIconProps = {
  nnType: string
}

const useStyles = makeStyles((theme) => ({
  icon: {
    paddingRight: theme.spacing(1),
  },
}))

const DatasetIcon = ({ nnType }: DatasetIconProps): React.ReactElement => {
  const classes = useStyles()

  switch (nnType) {
    case 'object_recognition':
      return <CenterFoxusStrong className={classes.icon} />
    case 'density_estimation':
      return <DragIndicator className={classes.icon} />
    case 'line_crossing_density':
      return <ReorderIcon className={classes.icon} />
    default:
      return <CenterFoxusStrong className={classes.icon} />
  }
}

export default DatasetIcon
