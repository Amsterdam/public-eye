// @ts-nocheck
import React, {
  useEffect,
  useState,
  useMemo,
} from 'react'
import {
  Card,
  CardHeader,
  CardContent,
  List,
  makeStyles,
} from '@material-ui/core'
import { useThunkDispatch } from 'store'
import { Dataset } from 'types'
import getDatasetById from 'thunks/datasets/getDatasetById'
import DatasetCardListItem from './DatasetCardListItem'

const extractDatasets = (
  payload: string,
): {
  trainDatasetId: number | null,
  valDatasetId: number | null,
} => {
  try {
    const {
      train_dataset_id: trainDatasetId,
      val_dataset_id: valDatasetId,
    } = JSON.parse(payload) as { train_dataset_id: number, val_dataset_id: number }
    return {
      trainDatasetId,
      valDatasetId,
    }
  } catch {
    return {
      trainDatasetId: null,
      valDatasetId: null,
    }
  }
}

const useGetDatasets = (
  payload: string,
): {
  trainDatasetId: number | null,
  valDatasetId: number | null,
} => {
  const [trainDatasetId, setTrainDatasetId] = useState<number | null>(null)
  const [valDatasetId, setValDatasetId] = useState<number | null>(null)

  useEffect(() => {
    const {
      trainDatasetId: newTrainDatasetId,
      valDatasetId: newValDatasetId,
    } = extractDatasets(payload)

    setTrainDatasetId(newTrainDatasetId)
    setValDatasetId(newValDatasetId)
  }, [payload])

  return {
    trainDatasetId,
    valDatasetId,
  }
}

const useGetDatasetById = (datasetId: number | null): Dataset | null => {
  const dispatch = useThunkDispatch()
  const [dataset, setDataset] = useState<Dataset | null>(null)

  useEffect(() => {
    if (datasetId !== null) {
      dispatch(getDatasetById(datasetId))
        .then((result) => {
          if (result) {
            setDataset(result)
          }
        })
    }
  }, [datasetId, dispatch])

  return dataset
}

const useStyles = makeStyles((theme) => ({
  card: {
    margin: theme.spacing(2),
  },
}))

const DatasetCard = ({
  jobPayload,
}: {
  jobPayload: string,
}): JSX.Element => {
  const classes = useStyles()
  const {
    trainDatasetId,
    valDatasetId,
  } = useGetDatasets(jobPayload)
  const trainDataset = useGetDatasetById(trainDatasetId)
  const valDataset = useGetDatasetById(valDatasetId)

  const datasets: { dataset: Dataset, type: string }[] = useMemo(() => (
    [
      { dataset: trainDataset as Dataset, type: 'Train' },
      { dataset: valDataset as Dataset, type: 'Validation' },
    ].filter(({ dataset }) => dataset !== null)
  ), [trainDataset, valDataset])

  return (
    <Card className={classes.card}>
      <CardHeader title="Datasets" />
      <CardContent>
        <List>
          {datasets.map(({ dataset, type }, index) => (
            <DatasetCardListItem
              key={index}
              dataset={dataset}
              type={type}
            />
          ))}
        </List>
      </CardContent>
    </Card>
  )
}

export default DatasetCard
