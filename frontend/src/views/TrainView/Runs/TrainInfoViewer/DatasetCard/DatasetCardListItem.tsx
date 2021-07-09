import React, {
  useCallback,
} from 'react'
import { useHistory } from 'react-router-dom'
import {
  ListItem,
  ListItemText,
} from '@material-ui/core'
import { Dataset } from 'types'

const DatasetCardListItem = ({
  dataset,
  type,
}: {
  dataset: Dataset,
  type: string,
}): React.ReactElement => {
  const history = useHistory()

  const navigate = useCallback(() => {
    history.push(`/ingest/datasets/${dataset.id}`)
  }, [history, dataset.id])

  return (
    <ListItem button onClick={navigate}>
      <ListItemText
        primary={dataset.name}
        secondary={`${type} - #${dataset.frame_count} frames`}
      />
    </ListItem>
  )
}

export default DatasetCardListItem
