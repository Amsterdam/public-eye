import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react'
import { range } from 'ramda'
import { useSelector } from 'react-redux'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import { getToken, getFileName, useSelectedId } from 'utils'
import getFramesAndLabelsForDataset from 'thunks/datasets/getFramesAndLabelsForDataset'
import Pagination from '@material-ui/lab/Pagination'
import { RootState } from 'reducers'
import { BoundingBox } from 'types'
import ImageWithBoundingBoxes from './ImageWithBoundingBoxes'

const useStyles = makeStyles((theme) => ({
  root: {
    height: `calc(100vh - ${theme.spacing(17)}px)`,
    overflow: 'auto',
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 'auto',
  },
  paper: {
    padding: theme.spacing(1),
    width: '100%',
  },
  paginationContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameContainer: {
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
}))

const IMAGES_ON_PAGE = 1

type FrameAndLabel = {
  frame_id: number,
  frame_path: string,
  bounding_box_id: number[],
  bounding_box_x: number[],
  bounding_box_y: number[],
  bounding_box_w: number[],
  bounding_box_h: number[],
  bounding_box_label: string[],
  bounding_box_rgb: string[],
}

const ObjectDataset = (): React.ReactElement => {
  const token = getToken()
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const ref = useRef(null)
  const baseUrl = useSelector((state: RootState) => state.general.baseUrl)
  // @ts-ignore
  const selectedId = useSelectedId()

  const [framesAndLabels, setFramesAndLabels] = useState([])

  useEffect(() => {
    if (selectedId === null) return
    // @ts-ignore
    dispatch(getFramesAndLabelsForDataset(selectedId))
      // @ts-ignore
      .then(setFramesAndLabels)
  }, [selectedId, dispatch])

  const makeFrameUrl = (id: number) => `${baseUrl}/files/frames/${id}?tk=${token}`

  const createRow = (entry: FrameAndLabel) => {
    const boundingBoxes: BoundingBox[] = []
    range(0, entry.bounding_box_id.length).forEach((i) => {
      // @ts-ignore
      boundingBoxes.push({
        x: entry.bounding_box_x[i],
        y: entry.bounding_box_y[i],
        h: entry.bounding_box_h[i],
        w: entry.bounding_box_w[i],
        rgb: entry.bounding_box_rgb[i],
      })
    })

    return (
      <Paper square className={classes.paper}>
        <ImageWithBoundingBoxes
          src={makeFrameUrl(entry.frame_id)}
          boundingBoxes={boundingBoxes}
          datasetSelectedId={selectedId}
        />

        <Typography>
          { getFileName(entry.frame_path) }
        </Typography>
      </Paper>
    )
  }

  const paginationCount = useMemo(() => (
    framesAndLabels
      ? Math.ceil(framesAndLabels.length / IMAGES_ON_PAGE)
      : 0
  ), [framesAndLabels])

  const [pagination, setPagination] = useState(1)

  useEffect(() => {
    setPagination(1)
  }, [selectedId])

  const handlePaginationChange = useCallback((e, value) => {
    setPagination(value)
  }, [])

  return (
    <div ref={ref} className={classes.root}>
      {
        framesAndLabels.length === 0
          ? (
            <Typography>
              This dataset does not contain any frames.
            </Typography>
          ) : (
            <>
              <div className={classes.frameContainer}>
                {createRow(framesAndLabels[pagination - 1])}
              </div>
              <div className={classes.paginationContainer}>
                <Pagination
                  onChange={handlePaginationChange}
                  page={pagination}
                  count={paginationCount}
                  variant="outlined"
                  shape="rounded"
                />
              </div>
            </>
          )
      }
    </div>
  )
}

export default ObjectDataset
